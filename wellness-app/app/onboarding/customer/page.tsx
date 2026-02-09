'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Steps, Card, Button, Form, Input, Select, Divider, notification } from 'antd';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

interface CustomerProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  preferences: string[];
  wellnessGoals: string;
  medicalInfo?: {
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
    notes?: string;
  };
  preferredTherapies: string[];
  appointmentFrequency?: string;
  lifestyleFactors?: string[];
  stressLevel?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

const CustomerOnboardingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [collectedData, setCollectedData] = useState<Partial<CustomerProfile>>({
    fullName: user?.name || '',
    email: user?.email || '',
    phoneNumber: '',
    preferences: [],
    wellnessGoals: '',
    medicalInfo: {
      conditions: [],
      allergies: [],
      medications: [],
      notes: ''
    },
    preferredTherapies: [],
    appointmentFrequency: undefined,
    lifestyleFactors: [],
    stressLevel: undefined,
    location: {
      city: '',
      state: '',
      country: ''
    }
  });

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      // Initialize collectedData with user information
      setCollectedData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName || '',
        email: user.email || prev.email || '',
      }));

      // In a real app, you would check if customer profile exists
      // For now, we'll assume if they reach this point, they haven't completed onboarding
      // This would involve an API call to check for existing customer profile
    };

    checkOnboardingStatus();
  }, [user, router]);

  const steps = [
    {
      title: 'Personal Details',
      content: 'Enter your personal information',
    },
    {
      title: 'Preferences',
      content: 'Tell us about your preferences',
    },
    {
      title: 'Wellness Goals',
      content: 'Share your wellness goals',
    },
    {
      title: 'Complete',
      content: 'Review and finish setup',
    },
  ];

  const onFinishProfile = async () => {
    try {
      setLoading(true);
      
      // Validate only the fields in the current step
      const profileValues = await profileForm.validateFields(['fullName', 'email', 'phoneNumber', 'location']);
      
      // Store the collected data
      setCollectedData(prev => ({
        ...prev,
        fullName: profileValues.fullName || prev.fullName,
        email: user?.email || profileValues.email || prev.email,
        phoneNumber: profileValues.phoneNumber || '',
        location: {
          city: profileValues.location?.city || '',
          state: profileValues.location?.state || '',
          country: profileValues.location?.country || ''
        }
      }));
      
      notification.success({
        title: 'Success',
        description: 'Personal details saved!',
      });
      
      setCurrentStep(1);
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Please fill in all required fields',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferences = async () => {
    try {
      setLoading(true);
      
      // Validate only the fields in the current step
      const preferencesValues = await profileForm.validateFields(['preferences', 'preferredTherapies', 'frequency']);
      
      // Store the collected data
      setCollectedData(prev => ({
        ...prev,
        preferences: preferencesValues.preferences || [],
        preferredTherapies: preferencesValues.preferredTherapies || [],
        appointmentFrequency: preferencesValues.frequency || undefined,
      }));
      
      notification.success({
        title: 'Success',
        description: 'Preferences saved!',
      });
      
      setCurrentStep(2);
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Please fill in required fields',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWellnessGoals = async () => {
    try {
      setLoading(true);
      
      // Validate only the fields in the current step
      const wellnessValues = await profileForm.validateFields(['wellnessGoals', 'medicalConditions', 'stressLevel', 'lifestyleFactors']);
      
      // Store the collected data
      setCollectedData(prev => ({
        ...prev,
        wellnessGoals: wellnessValues.wellnessGoals || '',
        medicalInfo: {
          conditions: [],
          allergies: [],
          medications: [],
          notes: wellnessValues.medicalConditions || ''
        },
        stressLevel: wellnessValues.stressLevel || undefined,
        lifestyleFactors: wellnessValues.lifestyleFactors || [],
      }));
      
      notification.success({
        title: 'Success',
        description: 'Wellness goals saved!',
      });
      
      setCurrentStep(3);
    } catch (error: any) {
      notification.error({
        title: 'Error',
        description: error.message || 'Please fill in required fields',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);
      
      // Validate that we have all required data
      if (!collectedData.fullName || !collectedData.email || !collectedData.wellnessGoals) {
        throw new Error('Missing required profile information. Please complete all steps.');
      }
      
      // Submit all collected data to the API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Sending collected data to API:', JSON.stringify({
        ...collectedData,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        fullName: collectedData.fullName || user?.name || '',
        email: collectedData.email || user?.email || '',
        phoneNumber: collectedData.phoneNumber || '',
        wellnessGoals: collectedData.wellnessGoals || '',
      }, null, 2));

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...collectedData,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          // Ensure required fields are present
          fullName: collectedData.fullName || user?.name || '',
          email: collectedData.email || user?.email || '',
          phoneNumber: collectedData.phoneNumber || '',
          wellnessGoals: collectedData.wellnessGoals || '',
          // Transform preferences to correct structure
          preferences: (collectedData.preferences || []).map(pref => ({
            type: 'service', // default type
            value: pref,
            category: 'general'
          })),
          medicalInfo: {
            conditions: [],
            allergies: [],
            medications: [],
            notes: collectedData.medicalInfo?.notes || ''
          }
        }),
      });

      // Check if response is OK and contains JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create customer profile');
      }
      
      notification.success({
        title: 'Success',
        description: 'Customer profile created successfully!',
      });
      
      router.push('/search');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      notification.error({
        title: 'Error',
        description: error.message || 'Failed to complete onboarding. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const next = () => {
    console.log('Next button clicked, current step:', currentStep);
    if (currentStep === 0) {
      console.log('Calling onFinishProfile');
      onFinishProfile();
    } else if (currentStep === 1) {
      console.log('Calling handlePreferences');
      handlePreferences();
    } else if (currentStep === 2) {
      console.log('Calling handleWellnessGoals');
      handleWellnessGoals();
    }
  };

  const stepsContent = [
    // Personal Details Step
    <div key="personal-details-step">
      <Card title="Personal Information" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            email: user?.email || '',
            fullName: user?.name || '',
            phoneNumber: '',
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
            <Input placeholder="Enter your email" disabled={!!user?.email} />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
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
        </Form>
      </Card>
    </div>,

    // Preferences Step
    <div key="preferences-step">
      <Card title="Your Preferences" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={profileForm}
          layout="vertical"
        >
          <Form.Item name="preferences" label="Service Preferences">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select your service preferences (press Enter to add)"
              tokenSeparators={[',']}
            >
              <Option value="massage">Massage Therapy</Option>
              <Option value="spa">Spa Services</Option>
              <Option value="wellness">Wellness Programs</Option>
              <Option value="corporate">Corporate Wellness</Option>
            </Select>
          </Form.Item>

          <Form.Item name="preferredTherapies" label="Preferred Therapies">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select your preferred therapies (press Enter to add)"
              tokenSeparators={[',']}
            >
              <Option value="swedish-massage">Swedish Massage</Option>
              <Option value="deep-tissue-massage">Deep Tissue Massage</Option>
              <Option value="aromatherapy-massage">Aromatherapy Massage</Option>
              <Option value="hot-stone-massage">Hot Stone Massage</Option>
              <Option value="thai-massage">Thai Massage</Option>
              <Option value="reflexology-foot-massage">Reflexology (Foot Massage)</Option>
              <Option value="head-neck-shoulder-massage">Head, Neck & Shoulder Massage</Option>
              <Option value="facial-treatments">Facial Treatments (Basic / Advanced)</Option>
              <Option value="body-scrub-polishing">Body Scrub & Body Polishing</Option>
              <Option value="body-wrap-therapy">Body Wrap Therapy</Option>
              <Option value="manicure-pedicure">Manicure & Pedicure</Option>
              <Option value="hair-spa-treatment">Hair Spa Treatment</Option>
              <Option value="meditation-mindfulness">Meditation & Mindfulness Programs</Option>
              <Option value="weight-management">Weight Management Programs</Option>
              <Option value="stress-management-therapy">Stress Management Therapy</Option>
              <Option value="detox-lifestyle-improvement">Detox & Lifestyle Improvement Programs</Option>
              <Option value="mental-wellness-counseling">Mental Wellness Counseling</Option>
              <Option value="sleep-improvement-programs">Sleep Improvement Programs</Option>
            </Select>
          </Form.Item>

          <Form.Item name="frequency" label="Appointment Frequency">
            <Select placeholder="How often do you typically book services?">
              <Option value="weekly">Weekly</Option>
              <Option value="bi-weekly">Bi-weekly (every 2 weeks)</Option>
              <Option value="monthly">Monthly</Option>
              <Option value="occasional">Occasionally</Option>
              <Option value="first-time">First time trying</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>,

    // Wellness Goals Step
    <div key="wellness-goals-step">
      <Card title="Wellness Goals & Health Information" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={profileForm}
          layout="vertical"
        >
          <Form.Item
            name="wellnessGoals"
            label="Your Wellness Goals"
            rules={[{ required: true, message: 'Please share your wellness goals' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Tell us about your wellness goals and what you hope to achieve through our services" 
            />
          </Form.Item>

          <Form.Item name="medicalConditions" label="Medical Conditions or Allergies">
            <TextArea 
              rows={3} 
              placeholder="Please share any medical conditions, allergies, or health concerns we should be aware of" 
            />
          </Form.Item>

          <Form.Item name="stressLevel" label="Current Stress Level">
            <Select placeholder="How would you rate your current stress level?">
              <Option value="low">Low</Option>
              <Option value="moderate">Moderate</Option>
              <Option value="high">High</Option>
              <Option value="very-high">Very High</Option>
            </Select>
          </Form.Item>

          <Form.Item name="lifestyleFactors" label="Lifestyle Factors">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select lifestyle factors that apply to you (press Enter to add)"
              tokenSeparators={[',']}
            >
              <Option value="sedentary">Mostly sedentary</Option>
              <Option value="moderately-active">Moderately active</Option>
              <Option value="very-active">Very active</Option>
              <Option value="office-worker">Office worker</Option>
              <Option value="shift-work">Shift work</Option>
              <Option value="travel-frequent">Travel frequently</Option>
              <Option value="family-oriented">Family oriented</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>,

    // Complete Step
    <div key="complete-step">
      <Card title="Welcome to Your Dashboard!" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2>Congratulations!</h2>
          <p>Your customer profile has been successfully created.</p>
          <p>You're now ready to book appointments and access wellness services.</p>
          
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
    <div key="personal-details-actions" style={{ textAlign: 'center', marginTop: 24 }}>
      <Button type="primary" loading={loading} onClick={next}>
        Continue to Preferences
      </Button>
    </div>,
    <div key="preferences-actions" style={{ textAlign: 'center', marginTop: 24 }}>
      <Button style={{ margin: '0 8px' }} onClick={prev}>
        Previous
      </Button>
      <Button type="primary" loading={loading} onClick={next}>
        Continue to Goals
      </Button>
    </div>,
    <div key="wellness-goals-actions" style={{ textAlign: 'center', marginTop: 24 }}>
      <Button style={{ margin: '0 8px' }} onClick={prev}>
        Previous
      </Button>
      <Button type="primary" loading={loading} onClick={next}>
        Finish Setup
      </Button>
    </div>,
    null, // No actions for the last step since it has its own button
  ];

  if (!user || user.role.toLowerCase() !== 'customer') {
    return null; // Or render a redirect message
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Customer Onboarding</h1>
      
      <Steps 
        current={currentStep} 
        items={steps.map(item => ({ 
          title: item.title, 
          content: item.content 
        }))} 
        style={{ marginBottom: 32, maxWidth: 800, margin: '0 auto' }} 
      />

      <div>{stepsContent[currentStep]}</div>
      
      {stepsActions[currentStep]}
    </div>
  );
};

export default CustomerOnboardingPage;