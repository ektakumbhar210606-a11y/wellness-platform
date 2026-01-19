'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, InputNumber, Select, Upload, Button, Divider, notification, Spin, Tabs } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import { therapistApi } from '../../../utils/apiUtils';
import WeeklyAvailability from '../../../components/Availability/WeeklyAvailability';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;

const TherapistProfilePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'therapist') {
        router.push('/');
        return;
      }

      try {
        const response = await therapistApi.getProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          // If profile doesn't exist, redirect to onboarding
          router.push('/onboarding/therapist');
        }
      } catch (error) {
        console.error('Error fetching therapist profile:', error);
        notification.error({
          title: 'Error',
          description: 'Failed to load profile data',
        });
        // If profile doesn't exist, redirect to onboarding
        router.push('/onboarding/therapist');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return null; // Already redirected in useEffect
  }

  // Render the form content only after profile is loaded to avoid form connection warnings
  return <TherapistProfileFormContent profile={profile} user={user} router={router} saving={saving} setSaving={setSaving} />;
};

// Child component to ensure forms are only created when they will be used
const TherapistProfileFormContent = ({ profile, user, router, saving, setSaving }: { profile: any; user: any; router: any; saving: boolean; setSaving: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [profileForm] = Form.useForm();
  const [availabilityForm] = Form.useForm();

  // Set initial form values after forms are created
  useEffect(() => {
    profileForm.setFieldsValue({
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      professionalTitle: profile.professionalTitle,
      bio: profile.bio,
      experience: profile.experience,
      location: profile.location,
      skills: profile.skills,
      certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
      licenseNumber: profile.licenseNumber,
    });
  }, [profile]);

  const handleProfileSubmit = async (values: any) => {
    try {
      setSaving(true);
      
      // Prepare profile data
      const profileData = {
        ...values,
      };

      // Call API to update therapist profile
      const response = await therapistApi.updateProfile(profileData);
      
      if (response.success) {
        notification.success({
          title: 'Success',
          description: 'Therapist profile updated successfully!',
        });
        
        // Navigate back to the therapist dashboard after a short delay to allow the user to see the success message
        setTimeout(() => {
          router.push('/dashboard/therapist');
        }, 1500);
      }
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilitySubmit = async (values: any) => {
    try {
      setSaving(true);
      
      // Update profile with availability
      const response = await therapistApi.updateProfile({
        weeklyAvailability: values.weeklyAvailability || []
      });
      
      if (response.success) {
        notification.success({
          title: 'Success',
          description: 'Availability updated successfully!',
        });
        
        // Navigate back to the therapist dashboard after a short delay to allow the user to see the success message
        setTimeout(() => {
          router.push('/dashboard/therapist');
        }, 1500);
      }
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Failed to update availability',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          <span>Therapist Profile Management</span>
        </div>
      }>
        <Tabs 
          defaultActiveKey="1" 
          size="large"
          items={[
            {
              label: 'Profile Information',
              key: '1',
              children: (
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileSubmit}
                  initialValues={{
                    email: user?.email || '',
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

                  <Divider />

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      Save Profile Changes
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              label: 'Availability',
              key: '2',
              children: (
                <Form
                  form={availabilityForm}
                  layout="vertical"
                  onFinish={handleAvailabilitySubmit}
                >
                  <Card title="Weekly Availability Settings">
                    <WeeklyAvailability 
                      initialAvailability={profile?.weeklyAvailability || []} 
                      onChange={(availability) => {
                        // Update the form field with the new availability
                        availabilityForm.setFieldsValue({
                          weeklyAvailability: availability
                        });
                      }}
                    />
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={saving}>
                        Save Availability
                      </Button>
                    </Form.Item>
                  </Card>
                </Form>
              ),
            }
          ]}
        />
      </Card>
    </div>
  );
}

export default TherapistProfilePage;