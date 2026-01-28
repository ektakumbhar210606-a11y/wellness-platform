'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Steps, Card, Button, Form, Input, InputNumber, Select, Upload, Divider, notification } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { therapistApi } from '../../utils/apiUtils';
import WeeklyAvailability from '../../components/Availability/WeeklyAvailability';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;

const TherapistOnboardingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [availabilityForm] = Form.useForm();
  const [serviceCategories, setServiceCategories] = useState<{id: string, name: string}[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || user.role.toLowerCase() !== 'therapist') {
        router.push('/');
        return;
      }

      try {
        const response = await therapistApi.getProfile();
        if (response.success && response.data) {
          // Profile already exists, redirect to dashboard
          router.push('/dashboard/therapist');
        }
      } catch (error) {
        // Profile doesn't exist yet, continue with onboarding
        console.log('Therapist profile not found, continuing with onboarding');
      }
    };

    checkOnboardingStatus();
  }, [user, router]);

  // Fetch service categories for expertise dropdown
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch('/api/service-categories');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setServiceCategories(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch service categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchServiceCategories();
  }, []);

  const steps = [
    {
      title: 'Profile Details',
      content: 'Enter your professional information',
    },
    {
      title: 'Availability',
      content: 'Set your weekly availability',
    },
    {
      title: 'Complete',
      content: 'Review and finish setup',
    },
  ];

  const onFinishProfile = async () => {
    try {
      setLoading(true);
      
      const profileValues = await profileForm.validateFields();
      
      // Prepare profile data
      const profileData = {
        ...profileValues,
        email: user?.email || profileValues.email, // Use user email if available
      };

      try {
        // First try to create therapist profile
        await therapistApi.createProfile(profileData);
        
        notification.success({
          title: 'Success',
          description: 'Therapist profile created successfully!',
        });
      } catch (createError: any) {
        // If create fails because profile already exists, try updating instead
        if (createError.message && (createError.message.includes('already exists') || createError.message.includes('409'))) {
          // Profile already exists, so update it instead
          await therapistApi.updateProfile(profileData);
          
          notification.success({
            title: 'Success',
            description: 'Therapist profile updated successfully!',
          });
        } else {
          // Some other error occurred
          throw createError;
        }
      }
      
      setCurrentStep(1);
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Failed to create profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishAvailability = async () => {
    try {
      setLoading(true);
      
      const availabilityValues = await availabilityForm.validateFields();
      
      // Clean up the availability data before sending to API
      const availabilityData = availabilityValues.weeklyAvailability || [];
      const cleanedAvailability = availabilityData.map((avail: any) => {
        if (avail.available === false) {
          // If day is not available, remove startTime and endTime
          return {
            day: avail.day,
            available: avail.available,
            // Don't include startTime and endTime when not available
          };
        } else {
          // If day is available, ensure all required fields are present
          return {
            day: avail.day,
            available: avail.available,
            startTime: avail.startTime,
            endTime: avail.endTime,
          };
        }
      });
      
      // Update profile with availability
      await therapistApi.updateProfile({
        weeklyAvailability: cleanedAvailability
      });
      
      notification.success({
        title: 'Success',
        description: 'Availability updated successfully!',
      });
      
      setCurrentStep(2);
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Failed to update availability',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    router.push('/dashboard/therapist');
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const next = () => {
    if (currentStep === 0) {
      onFinishProfile();
    } else if (currentStep === 1) {
      onFinishAvailability();
    }
  };

  const stepsContent = [
    // Profile Step
    <div key="profile-step">
      <Card title="Professional Profile" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            email: user?.email || '',
            fullName: user?.name || '',
            phoneNumber: '',
            certifications: [],
          }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter your email" disabled />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item
            name="professionalTitle"
            label="Professional Title"
            rules={[{ required: true, message: 'Please enter your professional title' }]}
          >
            <Input placeholder="e.g., Licensed Massage Therapist" />
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <TextArea rows={4} placeholder="Tell us about your background and expertise" />
          </Form.Item>

          <Form.Item
            name="experience"
            label="Years of Experience"
            rules={[
              { required: true, message: 'Please enter your years of experience' },
              { type: 'number', min: 0, message: 'Experience must be a positive number' },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Years of experience" />
          </Form.Item>

          <Form.Item label="Location">
            <Form.Item
              name={['location', 'city']}
              style={{ display: 'inline-block', width: 'calc(33.33% - 8px)' }}
            >
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item
              name={['location', 'state']}
              style={{ display: 'inline-block', width: 'calc(33.33% - 8px)', margin: '0 8px' }}
            >
              <Input placeholder="State" />
            </Form.Item>
            <Form.Item
              name={['location', 'country']}
              style={{ display: 'inline-block', width: 'calc(33.33% - 8px)' }}
            >
              <Input placeholder="Country" />
            </Form.Item>
          </Form.Item>

          <Form.Item name="skills" label="Skills">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Add your skills (press Enter to add)"
              tokenSeparators={[',']}
            >
            </Select>
          </Form.Item>

          <Form.Item
            name="expertise"
            label="Areas of Expertise"
            rules={[{ required: true, message: 'Please select at least one area of expertise' }]}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select your areas of expertise"
              loading={categoriesLoading}
              notFoundContent={categoriesLoading ? 'Loading...' : 'No categories found'}
              options={serviceCategories.map(category => ({
                value: category.id,
                label: category.name
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="certifications" label="Certifications">
            <Select
              key="certifications-select"
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Add your certifications (press Enter to add)"
              tokenSeparators={[',']}
            >
            </Select>
          </Form.Item>

          <Form.Item
            name="licenseNumber"
            label="License Number"
            rules={[{ required: true, message: 'Please enter your license number' }]}
          >
            <Input placeholder="Enter your license number" />
          </Form.Item>
        </Form>
      </Card>
    </div>,

    // Availability Step
    <div key="availability-step">
      <Card title="Weekly Availability" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form form={availabilityForm} layout="vertical">
          <WeeklyAvailability 
            onChange={(availability) => {
              // Update the form field with the new availability
              availabilityForm.setFieldsValue({
                weeklyAvailability: availability
              });
            }}
          />
        </Form>
      </Card>
    </div>,

    // Complete Step
    <div key="complete-step">
      <Card title="Welcome to Your Dashboard!" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2>Congratulations!</h2>
          <p>Your therapist profile has been successfully created.</p>
          <p>You're now ready to start accepting appointments.</p>
          
          <Divider />
          
          <div style={{ marginTop: 20 }}>
            <Button type="primary" size="large" onClick={handleCompleteOnboarding}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>,
  ];

  const stepsActions = [
    <div key="profile-actions" style={{ textAlign: 'center', marginTop: 24 }}>
      <Button type="primary" loading={loading} onClick={next}>
        Continue to Availability
      </Button>
    </div>,
    <div key="availability-actions" style={{ textAlign: 'center', marginTop: 24 }}>
      <Button style={{ margin: '0 8px' }} onClick={prev}>
        Previous
      </Button>
      <Button type="primary" loading={loading} onClick={next}>
        Finish Setup
      </Button>
    </div>,
    null, // No actions for the last step since it has its own button
  ];

  if (!user || user.role.toLowerCase() !== 'therapist') {
    return null; // Or render a redirect message
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Therapist Onboarding</h1>
      
      <Steps current={currentStep} items={steps.map(item => ({ title: item.title, content: item.content }))} style={{ marginBottom: 32, maxWidth: 800, margin: '0 auto' }} />

      <div>{stepsContent[currentStep]}</div>
      
      {stepsActions[currentStep]}
    </div>
  );
};

export default TherapistOnboardingPage;