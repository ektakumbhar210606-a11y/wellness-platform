'use client';

import React, { useState } from 'react';
import { 
  Steps, 
  Form, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Divider, 
  message, 
  TimePicker, 
  Select, 
  Table, 
  Tag,
  Space
} from 'antd';
import { 
  UserOutlined, 
  ShopOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { apiPostAuth, apiPutAuth } from '@/lib/api';
import dayjs from 'dayjs';
import { formatTimeRange } from '../utils/timeUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface BusinessHour {
  id: string;
  day: string;
  openingTime: dayjs.Dayjs;
  closingTime: dayjs.Dayjs;
}

interface FormData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  address: string;
  state: string;
  pincode: string;
  businessHours: BusinessHour[];
}

interface ProviderOnboardingProps {
  onComplete?: (formData: any) => void;
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  initialData?: any;
}

const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({ onComplete, userData, initialData }) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Form instances for each step
  const [basicForm] = Form.useForm();
  const [businessForm] = Form.useForm();
  const [locationForm] = Form.useForm();
  const [hoursForm] = Form.useForm();
  
  // Data storage
  const [formData, setFormData] = useState<FormData>(() => {
    // If initialData is provided, use it to prefill the form
    if (initialData) {
      return {
        fullName: initialData.ownerName || userData?.name || '',
        email: initialData.email || userData?.email || '',
        password: '',
        phoneNumber: initialData.phone || userData?.phone || '',
        businessName: initialData.business_name || initialData.name || '',
        businessDescription: initialData.description || '',
        address: initialData.address?.street || '',
        state: initialData.address?.state || '',
        pincode: initialData.address?.zipCode || '',
        businessHours: initialData.businessHours || [],
      };
    }
    
    // Otherwise use default empty values
    return {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      businessName: '',
      businessDescription: '',
      address: '',
      state: '',
      pincode: '',
      businessHours: [],
    };
  });
  
  // Loading state for submission
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Auto-fill form data when userData is provided
  React.useEffect(() => {
    if (userData) {
      // Set initial form data with user information
      setFormData(prev => ({
        ...prev,
        fullName: userData.name || prev.fullName,
        email: userData.email || prev.email,
        phoneNumber: userData.phone || prev.phoneNumber,
      }));
      
      // Set form field values
      basicForm.setFieldsValue({
        fullName: userData.name,
        email: userData.email,
        phoneNumber: userData.phone,
      });
    }
  }, [userData, basicForm]);

  const steps = [
    {
      title: 'Basic Info',
      icon: <UserOutlined />,
    },
    {
      title: 'Business Info',
      icon: <ShopOutlined />,
    },
    {
      title: 'Location',
      icon: <EnvironmentOutlined />,
    },
    {
      title: 'Business Hours',
      icon: <ClockCircleOutlined />,
    },
    {
      title: 'Final Setup',
      icon: <CheckCircleOutlined />,
    },
  ];

  const handleNext = () => {
    let isValid = true;
    
    // Validate current step based on index
    switch(currentStep) {
      case 0: // Basic Information
        basicForm.validateFields().then(values => {
          setFormData(prev => ({
            ...prev,
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            phoneNumber: values.phoneNumber,
          }));
          setCurrentStep(prev => prev + 1);
        }).catch(() => {
          isValid = false;
          message.error('Please fill in all required fields');
        });
        break;
        
      case 1: // Business Information
        businessForm.validateFields().then(values => {
          setFormData(prev => ({
            ...prev,
            businessName: values.businessName,
            businessDescription: values.businessDescription,
          }));
          setCurrentStep(prev => prev + 1);
        }).catch(() => {
          isValid = false;
          message.error('Please fill in all required fields');
        });
        break;
        
      case 2: // Location Information
        locationForm.validateFields().then(values => {
          setFormData(prev => ({
            ...prev,
            address: values.address,
            state: values.state,
            pincode: values.pincode,
          }));
          setCurrentStep(prev => prev + 1);
        }).catch(() => {
          isValid = false;
          message.error('Please fill in all required fields');
        });
        break;
        
      case 3: // Business Hours
        hoursForm.validateFields().then(values => {
          setFormData(prev => ({
            ...prev,
            businessHours: values.businessHours,
          }));
          setCurrentStep(prev => prev + 1);
        }).catch(() => {
          isValid = false;
          message.error('Please configure your business hours');
        });
        break;
        
      default:
        // For the last step, we'll handle the submission separately
        break;
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Add business hour row
  const [hourRows, setHourRows] = useState<BusinessHour[]>([]);
  
  const addHourRow = () => {
    setHourRows(prev => [
      ...prev,
      {
        id: `hour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        day: 'Monday',
        openingTime: dayjs().hour(9).minute(0),
        closingTime: dayjs().hour(17).minute(0),
      }
    ]);
  };

  const removeHourRow = (index: number) => {
    setHourRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateHourRow = (index: number, field: keyof BusinessHour, value: any) => {
    setHourRows(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Transform the form data to match API expectations
      const businessData = {
        business_name: formData.businessName,
        description: formData.businessDescription,
        phone: formData.phoneNumber,  // Changed from phone_number to phone
        email: formData.email,      // Add email field
        address: {
          street: formData.address,
          city: 'Default City', // Provide a default city value
          state: formData.state,
          zipCode: formData.pincode,
          country: 'USA' // Default or add to form
        },
        opening_time: hourRows.length > 0 ? hourRows[0].openingTime.format('HH:mm') : '09:00',
        closing_time: hourRows.length > 0 ? hourRows[0].closingTime.format('HH:mm') : '17:00',
        status: 'active',
        businessHours: hourRows.map(hour => ({
          day: hour.day,
          openingTime: hour.openingTime.format('HH:mm'),
          closingTime: hour.closingTime.format('HH:mm'),
        }))
      };

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Submit to backend API - use update if initialData exists, otherwise create
      let response;
      if (initialData) {
        // Update existing business profile
        response = await apiPutAuth('/api/businesses/update', businessData);
        message.success('Business profile updated successfully!');
      } else {
        // Create new business profile
        response = await apiPostAuth('/api/businesses/create', businessData);
        message.success('Provider profile created successfully!');
      }

      // Call completion callback if provided
      if (onComplete) {
        onComplete(response);
      }
    } catch (error: any) {
      console.error('Error submitting provider onboarding:', error);
      message.error(error.message || 'Failed to create provider profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Columns for business hours table
  const columns = [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      render: (_: any, record: BusinessHour) => {
        // Find the index based on the record's id
        const index = hourRows.findIndex(row => row.id === record.id);
        return (
          <Select 
            value={record.day} 
            onChange={(value) => updateHourRow(index, 'day', value)}
            style={{ width: '100%' }}
          >
            <Option value="Monday">Monday</Option>
            <Option value="Tuesday">Tuesday</Option>
            <Option value="Wednesday">Wednesday</Option>
            <Option value="Thursday">Thursday</Option>
            <Option value="Friday">Friday</Option>
            <Option value="Saturday">Saturday</Option>
            <Option value="Sunday">Sunday</Option>
          </Select>
        );
      },
    },
    {
      title: 'Opening Time',
      dataIndex: 'openingTime',
      key: 'openingTime',
      render: (_: any, record: BusinessHour) => {
        // Find the index based on the record's id
        const index = hourRows.findIndex(row => row.id === record.id);
        return (
          <TimePicker
            value={record.openingTime}
            onChange={(value) => updateHourRow(index, 'openingTime', value)}
            format="HH:mm"
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      title: 'Closing Time',
      dataIndex: 'closingTime',
      key: 'closingTime',
      render: (_: any, record: BusinessHour) => {
        // Find the index based on the record's id
        const index = hourRows.findIndex(row => row.id === record.id);
        return (
          <TimePicker
            value={record.closingTime}
            onChange={(value) => updateHourRow(index, 'closingTime', value)}
            format="HH:mm"
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BusinessHour) => {
        // Find the index based on the record's id
        const index = hourRows.findIndex(row => row.id === record.id);
        return (
          <Button 
            type="link" 
            danger
            onClick={() => removeHourRow(index)}
            disabled={hourRows.length <= 1}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px' }}>
        <Steps 
          current={currentStep} 
          items={steps.map((step, index) => ({
            title: step.title,
            icon: step.icon,
            status: currentStep > index ? 'finish' : currentStep === index ? 'process' : 'wait'
          }))}
          style={{ marginBottom: '32px' }}
        />
        
        <Divider />
        
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <Form
            form={basicForm}
            layout="vertical"
            initialValues={{
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              phoneNumber: formData.phoneNumber,
            }}
          >
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[
                { required: true, message: 'Please enter your full name' },
                { min: 2, message: 'Name must be at least 2 characters' },
                { max: 50, message: 'Name must not exceed 50 characters' }
              ]}
            >
              <Input 
                placeholder="Enter your full name" 
                prefix={<UserOutlined />}
                size="large"
                readOnly={!!userData?.name}
              />
            </Form.Item>
                    
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input 
                placeholder="Enter your email" 
                type="email"
                size="large"
                readOnly={!!userData?.email}
              />
            </Form.Item>
                    
            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[
                { required: true, message: 'Please enter your phone number' },
                { pattern: /^\+?[1-9]\d{1,14}$/, message: 'Please enter a valid phone number' }
              ]}
            >
              <Input 
                placeholder="Enter your phone number" 
                size="large"
                readOnly={!!userData?.phone}
              />
            </Form.Item>
                    
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                placeholder="Enter your password" 
                size="large"
              />
            </Form.Item>
          </Form>
        )}
        
        {/* Step 2: Business Information */}
        {currentStep === 1 && (
          <Form
            form={businessForm}
            layout="vertical"
            initialValues={{
              businessName: formData.businessName,
              businessDescription: formData.businessDescription,
            }}
          >
            <Form.Item
              label="Business Name"
              name="businessName"
              rules={[
                { required: true, message: 'Please enter your business name' },
                { min: 2, message: 'Business name must be at least 2 characters' },
                { max: 100, message: 'Business name must not exceed 100 characters' }
              ]}
            >
              <Input 
                placeholder="Enter your business name" 
                prefix={<ShopOutlined />}
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              label="Business Description"
              name="businessDescription"
              rules={[
                { required: true, message: 'Please enter a business description' },
                { max: 500, message: 'Description must not exceed 500 characters' }
              ]}
            >
              <TextArea 
                placeholder="Describe your business and services" 
                rows={4}
                maxLength={500}
              />
            </Form.Item>
          </Form>
        )}
        
        {/* Step 3: Location Information */}
        {currentStep === 2 && (
          <Form
            form={locationForm}
            layout="vertical"
            initialValues={{
              address: formData.address,
              state: formData.state,
              pincode: formData.pincode,
            }}
          >
            <Form.Item
              label="Address"
              name="address"
              rules={[
                { required: true, message: 'Please enter your address' },
                { max: 200, message: 'Address must not exceed 200 characters' }
              ]}
            >
              <TextArea 
                placeholder="Enter your business address" 
                rows={3}
                maxLength={200}
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="State"
                  name="state"
                  rules={[
                    { required: true, message: 'Please enter your state' },
                    { max: 50, message: 'State name must not exceed 50 characters' }
                  ]}
                >
                  <Input 
                    placeholder="Enter your state" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  label="Pincode"
                  name="pincode"
                  rules={[
                    { required: true, message: 'Please enter your pincode' },
                    { pattern: /^\d{6}$/, message: 'Please enter a valid 6-digit pincode' }
                  ]}
                >
                  <Input 
                    placeholder="Enter your pincode" 
                    size="large"
                    maxLength={6}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        
        {/* Step 4: Business Hours */}
        {currentStep === 3 && (
          <Form
            form={hoursForm}
            layout="vertical"
            initialValues={{
              businessHours: formData.businessHours,
            }}
          >
            <Paragraph>
              Set your business hours for each day of the week
            </Paragraph>
            
            <Form.Item>
              <Table
                dataSource={hourRows}
                columns={columns}
                pagination={false}
                rowKey="id"
                footer={() => (
                  <Button 
                    type="dashed" 
                    onClick={addHourRow}
                    block
                  >
                    + Add Business Hour
                  </Button>
                )}
              />
            </Form.Item>
          </Form>
        )}
        
        {/* Step 5: Final Setup */}
        {currentStep === 4 && (
          <div>
            <Title level={4} style={{ marginBottom: '24px' }}>
              Review Your Information
            </Title>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Basic Information</Title>
              <Paragraph><strong>Name:</strong> {formData.fullName}</Paragraph>
              <Paragraph><strong>Email:</strong> {formData.email}</Paragraph>
            </Card>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Business Information</Title>
              <Paragraph><strong>Business Name:</strong> {formData.businessName}</Paragraph>
              <Paragraph><strong>Description:</strong> {formData.businessDescription}</Paragraph>
            </Card>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Location Information</Title>
              <Paragraph><strong>Address:</strong> {formData.address}</Paragraph>
              <Paragraph><strong>State:</strong> {formData.state}</Paragraph>
              <Paragraph><strong>Pincode:</strong> {formData.pincode}</Paragraph>
            </Card>
            
            <Card>
              <Title level={5}>Business Hours</Title>
              {hourRows.length > 0 ? (
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {hourRows.map((hour) => (
                    <div key={hour.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><Tag color="blue">{hour.day}</Tag></span>
                      <span>{formatTimeRange(hour.openingTime.format('HH:mm'), hour.closingTime.format('HH:mm'))}</span>
                    </div>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No business hours configured</Text>
              )}
            </Card>
          </div>
        )}
        
        <Divider />
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            disabled={currentStep === 0} 
            onClick={handlePrev}
            size="large"
          >
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button 
              type="primary" 
              onClick={handleNext}
              size="large"
            >
              Next
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSubmit}
              size="large"
              loading={submitting}
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderOnboarding;