'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Form, Input, Select, Divider, Typography, Row, Col } from 'antd';
import { useAuth } from '@/app/context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CustomerProfilePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      // In a real app, you would fetch customer profile
      // For now, we'll simulate having a profile
      // const response = await customerApi.getProfile();
      // if (response.success && response.data) {
      //   form.setFieldsValue(response.data);
      // } else {
      //   // If profile doesn't exist, redirect to onboarding
      //   router.push('/onboarding/customer');
      // }
      
      // TODO: Fetch actual profile data when connecting to database
      // const response = await customerApi.getProfile();
      // form.setFieldsValue(response.data);
      
      // Initialize form with empty values for clean state
      form.setFieldsValue({
        fullName: user.name || '',
        email: user.email || '',
        phoneNumber: '',
        location: { city: '', state: '', country: '' },
        preferences: [],
        wellnessGoals: '',
        medicalConditions: '',
        preferredTherapies: [],
        frequency: '',
        stressLevel: '',
        lifestyleFactors: []
      });

      setLoading(false);
    };

    checkAccess();
  }, [user, router, form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // In a real app, you would update the customer profile
      // await customerApi.updateProfile(values);
      
      // Update user in context/localStorage if needed
      // const updatedUser = { ...user, ...values };
      // login(updatedUser);
      
      // Show success message
      // notification.success({ message: 'Profile updated successfully!' });
      
      // Optionally redirect back to dashboard
      // router.push('/dashboard/customer');
    } catch (error: any) {
      // notification.error({ message: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role.toLowerCase() !== 'customer') {
    return null; // Or render a redirect message
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>Customer Profile</Title>
      <Text>Update your personal information and wellness preferences</Text>
      
      <Divider />
      
      <Card title="Personal Information" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            email: user?.email || '',
            fullName: user?.name || '',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input placeholder="Enter your full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input placeholder="Enter your phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['location', 'city']} label="City">
                <Input placeholder="Enter your city" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['location', 'state']} label="State">
                <Input placeholder="Enter your state" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['location', 'country']} label="Country">
                <Input placeholder="Enter your country" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Preferences" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item name="preferredTherapies" label="Preferred Therapies">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select your preferred therapies (press Enter to add)"
                tokenSeparators={[',']}
              >
                <Option value="swedish">Swedish Massage</Option>
                <Option value="deep-tissue">Deep Tissue Massage</Option>
                <Option value="hot-stone">Hot Stone Therapy</Option>
                <Option value="aromatherapy">Aromatherapy</Option>
                <Option value="reflexology">Reflexology</Option>
                <Option value="facials">Facials</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="frequency" label="Appointment Frequency">
          <Select placeholder="How often do you typically book services?">
            <Option value="weekly">Weekly</Option>
            <Option value="bi-weekly">Bi-weekly (every 2 weeks)</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="occasional">Occasionally</Option>
            <Option value="first-time">First time trying</Option>
          </Select>
        </Form.Item>
      </Card>

      <Card title="Wellness Information">
        <Row gutter={16}>
          <Col span={24}>
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
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="medicalConditions" label="Medical Conditions or Allergies">
              <TextArea 
                rows={3} 
                placeholder="Please share any medical conditions, allergies, or health concerns we should be aware of" 
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="stressLevel" label="Current Stress Level">
              <Select placeholder="How would you rate your current stress level?">
                <Option value="low">Low</Option>
                <Option value="moderate">Moderate</Option>
                <Option value="high">High</Option>
                <Option value="very-high">Very High</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button type="primary" htmlType="submit" size="large" loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default CustomerProfilePage;