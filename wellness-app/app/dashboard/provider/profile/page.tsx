'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, InputNumber, Select, Button, message, Divider, Upload, Space } from 'antd';
import { UserOutlined, ShopOutlined, EnvironmentOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { businessService, BusinessProfile } from '@/app/services/businessService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProviderProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      router.push('/dashboard');
      return;
    }

    // Fetch business profile
    const fetchBusinessProfile = async () => {
      try {
        const profile = await businessService.getBusinessProfile();
        setBusiness(profile);
        form.setFieldsValue({
          business_name: profile.business_name,
          description: profile.description,
          address: profile.address,
          status: profile.status,
        });
      } catch (error: any) {
        console.error('Error fetching business profile:', error);
        message.error(error.message || 'Failed to fetch business profile');
        if (error.status === 404) {
          router.push('/onboarding/provider');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [isAuthenticated, user, router, form]);

  const onFinish = async (values: any) => {
    try {
      // Update business profile
      const updatedBusiness = {
        ...values,
        id: business?.id, // Include existing ID if available
      };

      await businessService.createBusiness(updatedBusiness);
      message.success('Business profile updated successfully!');
      router.push('/dashboard/provider');
    } catch (error: any) {
      console.error('Error updating business profile:', error);
      message.error(error.message || 'Failed to update business profile');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <UserOutlined /> Business Profile
        </Title>
        <Text>Update your business information and profile</Text>
      </div>

      <Card title="Business Information">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            business_name: '',
            description: '',
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'USA',
            },
            status: 'active',
          }}
        >
          <Form.Item
            name="business_name"
            label="Business Name"
            rules={[{ required: true, message: 'Please enter business name' }]}
          >
            <Input 
              prefix={<ShopOutlined />} 
              placeholder="Enter business name" 
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Business Description"
            rules={[{ required: true, message: 'Please enter business description' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Describe your business and services" 
            />
          </Form.Item>

          <Form.Item
            name={['address', 'street']}
            label="Street Address"
            rules={[{ required: true, message: 'Please enter street address' }]}
          >
            <Input placeholder="Enter street address" />
          </Form.Item>

          <Form.Item
            label="City, State, ZIP Code"
          >
            <Space style={{ width: '100%' }} size="small">
              <Form.Item
                name={['address', 'city']}
                noStyle
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input style={{ width: '40%' }} placeholder="City" />
              </Form.Item>
              <Form.Item
                name={['address', 'state']}
                noStyle
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input style={{ width: '30%' }} placeholder="State" />
              </Form.Item>
              <Form.Item
                name={['address', 'zipCode']}
                noStyle
                rules={[{ required: true, message: 'Please enter ZIP code' }]}
              >
                <Input style={{ width: '30%' }} placeholder="ZIP Code" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name={['address', 'country']}
            label="Country"
            rules={[{ required: true, message: 'Please enter country' }]}
          >
            <Input placeholder="Country" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Business Status"
            rules={[{ required: true, message: 'Please select business status' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="Business Image"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Upload Business Image</Button>
            </Upload>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Profile
              </Button>
              <Button onClick={() => router.back()}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProviderProfilePage;