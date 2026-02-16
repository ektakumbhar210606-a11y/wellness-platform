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

// Utility function to ensure valid dayjs objects for time values
const ensureValidTime = (timeValue: any, defaultHour: number = 9, defaultMinute: number = 0): dayjs.Dayjs => {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('ensureValidTime called with:', { 
      timeValue, 
      type: typeof timeValue, 
      isDayjs: dayjs.isDayjs(timeValue),
      isValid: dayjs.isDayjs(timeValue) ? timeValue.isValid() : 'not dayjs'
    });
  }
  
  // If it's already a valid dayjs object, return it
  if (dayjs.isDayjs(timeValue) && timeValue.isValid()) {
    return timeValue;
  }
  
  // If it's a string, try to parse it
  if (typeof timeValue === 'string') {
    const parsed = dayjs(timeValue, 'HH:mm');
    if (parsed.isValid()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Parsed string time successfully:', parsed.format('HH:mm'));
      }
      return parsed;
    } else {
      console.warn('Failed to parse time string:', timeValue);
    }
  }
  
  // If it's invalid or undefined, create a new valid dayjs object
  const defaultValue = dayjs().hour(defaultHour).minute(defaultMinute).second(0).millisecond(0);
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating default time value:', defaultValue.format('HH:mm'));
  }
  return defaultValue;
};

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
  phoneNumber: string;
  businessName: string;
  businessDescription: string;
  serviceType: string;
  serviceName: string;
  address: string;
  state: string;
  pincode: string;
  country: string;
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
  showOnlyBusinessHours?: boolean;
}

const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({ onComplete, userData, initialData, showOnlyBusinessHours = false }) => {
  // Form instances for each step - Initialize only when component mounts
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
        phoneNumber: initialData.phone || userData?.phone || '',
        businessName: initialData.name || initialData.business_name || '',
        businessDescription: initialData.description || '',
        serviceType: initialData.serviceType || '',
        serviceName: initialData.serviceName || '',
        address: initialData.address?.street || '',
        state: initialData.address?.state || '',
        pincode: initialData.address?.zipCode || '',
        country: initialData.address?.country || 'default', // Default to default if not provided
        businessHours: initialData.businessHours || [],
      };
    }
    
    // Otherwise use default empty values
    return {
      fullName: '',
      email: '',
      phoneNumber: '',
      businessName: '',
      businessDescription: '',
      serviceType: '',
      serviceName: '',
      address: '',
      state: '',
      pincode: '',
      country: 'default', // Default to default
      businessHours: [],
    };
  });
  
  // Loading state for submission
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize form data only once when component mounts
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  React.useEffect(() => {
    if (!isInitialized) {
      // Process initial data once
      if (initialData) {
        const processedData = {
          fullName: initialData.ownerName || userData?.name || '',
          email: initialData.email || userData?.email || '',
          phoneNumber: initialData.phone || userData?.phone || '',
          businessName: initialData.name || initialData.business_name || '',
          businessDescription: initialData.description || '',
          serviceType: initialData.serviceType || '',
          serviceName: initialData.serviceName || '',
          address: initialData.address?.street || '',
          state: initialData.address?.state || '',
          pincode: initialData.address?.zipCode || '',
          country: initialData.address?.country || 'default', // Default to default if not provided
          businessHours: initialData.businessHours || [],
        };
        
        setFormData(processedData);
      } else if (userData) {
        // If only user data is available, use that
        setFormData(prev => ({
          ...prev,
          fullName: userData.name || prev.fullName,
          email: userData.email || prev.email,
          phoneNumber: userData.phone || prev.phoneNumber,
        }));
      }
      
      setIsInitialized(true);
    }
  }, [initialData, userData, isInitialized]);
  
  // After initialization and formData is set, populate the forms
  React.useEffect(() => {
    if (isInitialized && formData) {
      // Set basic form fields
      basicForm.setFieldsValue({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });
      
      // Set business form fields
      businessForm.setFieldsValue({
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
      });
      
      // Set location form fields
      locationForm.setFieldsValue({
        address: formData.address,
        state: formData.state,
        pincode: formData.pincode,
      });
    }
  }, [isInitialized, formData, basicForm, businessForm, locationForm]);

  // Initialize business hours from initialData
  const [hourRows, setHourRows] = useState<BusinessHour[]>(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing hourRows with initialData:', initialData);
    }
    if (initialData && initialData.businessHours) {
      // Convert businessHours object to array format
      const hoursArray: BusinessHour[] = [];
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      daysOfWeek.forEach(day => {
        const dayHours = initialData.businessHours?.[day];
        if (dayHours && !dayHours.closed) {
          hoursArray.push({
            id: `hour-${day.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            day,
            openingTime: ensureValidTime(dayHours.open, 9, 0),
            closingTime: ensureValidTime(dayHours.close, 17, 0),
          });
        }
      });
      
      return hoursArray;
    }
    
    // Default to Monday-Sunday 9am-5pm if no initial data
    return [
      {
        id: `hour-monday-${Date.now()}`,
        day: 'Monday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-tuesday-${Date.now()}`,
        day: 'Tuesday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-wednesday-${Date.now()}`,
        day: 'Wednesday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-thursday-${Date.now()}`,
        day: 'Thursday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-friday-${Date.now()}`,
        day: 'Friday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-saturday-${Date.now()}`,
        day: 'Saturday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
      {
        id: `hour-sunday-${Date.now()}`,
        day: 'Sunday',
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      },
    ];
  });

  // Monitor hourRows changes for debugging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('hourRows updated:', hourRows.map(row => ({
        day: row.day,
        openingTime: dayjs.isDayjs(row.openingTime) ? row.openingTime.format('HH:mm') : 'INVALID',
        closingTime: dayjs.isDayjs(row.closingTime) ? row.closingTime.format('HH:mm') : 'INVALID',
        isValid: dayjs.isDayjs(row.openingTime) && row.openingTime.isValid() && dayjs.isDayjs(row.closingTime) && row.closingTime.isValid()
      })));
    }
  }, [hourRows]);

  // Filter steps based on showOnlyBusinessHours prop
  const steps = showOnlyBusinessHours 
    ? [
        {
          title: 'Business Hours',
          icon: <ClockCircleOutlined />,
        }
      ]
    : [
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

  // Set initial step based on mode
  const initialStep = showOnlyBusinessHours ? 0 : 0;
  
  // Step management
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  const handleNext = () => {
    // In business hours only mode, go directly to submission
    if (showOnlyBusinessHours) {
      // Validate that there's at least one business hour set
      if (hourRows.length === 0) {
        message.error('Please configure at least one business hour');
        return;
      }
      setFormData(prev => ({
        ...prev,
        businessHours: hourRows,
      }));
      // In business hours only mode, next button becomes submit
      handleSubmit();
      return;
    }
    
    let isValid = true;
    
    // Validate current step based on index and mode
    switch(currentStep) {
      case 0: // Basic Information or Business Hours depending on mode
        if (showOnlyBusinessHours) {
          // Business Hours validation
          if (hourRows.length === 0) {
            message.error('Please configure at least one business hour');
            return;
          }
          setFormData(prev => ({
            ...prev,
            businessHours: hourRows,
          }));
          setCurrentStep(prev => prev + 1);
        } else {
          // Basic Information validation
          basicForm.validateFields().then(values => {
            setFormData(prev => ({
              ...prev,
              fullName: values.fullName,
              email: values.email,
              phoneNumber: values.phoneNumber,
            }));
            setCurrentStep(prev => prev + 1);
          }).catch((errorInfo) => {
            console.log('Basic form validation failed:', errorInfo);
            message.error('Please fill in all required fields in the Basic Information step');
          });
        }
        break;
        
      case 1: // Business Information
        businessForm.validateFields().then(values => {
          setFormData(prev => ({
            ...prev,
            businessName: values.businessName,
            businessDescription: values.businessDescription,
            serviceType: values.serviceType,
            serviceName: values.serviceName,
          }));
          setCurrentStep(prev => prev + 1);
        }).catch((errorInfo) => {
          console.log('Business form validation failed:', errorInfo);
          message.error('Please fill in all required fields in the Business Information step');
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
        }).catch((errorInfo) => {
          console.log('Location form validation failed:', errorInfo);
          message.error('Please fill in all required fields in the Location Information step');
        });
        break;
        
      case 3: // Business Hours
        // For business hours, we don't need to validate the form separately since we already manage the state
        // Just ensure there's at least one business hour set
        if (hourRows.length === 0) {
          message.error('Please configure at least one business hour');
          return;
        }
        setFormData(prev => ({
          ...prev,
          businessHours: hourRows,
        }));
        setCurrentStep(prev => prev + 1);
        break;
        
      default:
        // For the last step, we'll handle the submission separately
        break;
    }
  };

  const handlePrev = () => {
    // In business hours only mode, there's no previous step
    if (showOnlyBusinessHours) {
      return;
    }
    
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Add business hour row - this function is now using the existing hourRows state
  const addHourRow = () => {
    // Find the first day that doesn't have hours configured yet
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const configuredDays = hourRows.map(row => row.day);
    const nextAvailableDay = daysOfWeek.find(day => !configuredDays.includes(day)) || 'Monday';
    
    setHourRows(prev => [
      ...prev,
      {
        id: `hour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        day: nextAvailableDay,
        openingTime: ensureValidTime(undefined, 9, 0),
        closingTime: ensureValidTime(undefined, 17, 0),
      }
    ]);
  };

  const removeHourRow = (index: number) => {
    setHourRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateHourRow = (index: number, field: keyof BusinessHour, value: any) => {
    setHourRows(prev => 
      prev.map((row, i) => {
        if (i === index) {
          // Ensure time values remain valid dayjs objects
          if (field === 'openingTime' || field === 'closingTime') {
            return { ...row, [field]: ensureValidTime(value) };
          }
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Validate forms before submission - only validate fields that exist in current mode
      if (!showOnlyBusinessHours) {
        // Full onboarding mode - validate all fields
        if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.businessName || !formData.businessDescription || !formData.address || !formData.state || !formData.pincode) {
          message.error('Please fill in all required fields');
          setSubmitting(false);
          return;
        }
      } else {
        // Business hours only mode - only validate business hours exist
        if (hourRows.length === 0) {
          message.error('Please configure at least one business hour');
          setSubmitting(false);
          return;
        }
      }
      
      // Transform the form data to match API expectations
      const businessData = {
        business_name: formData.businessName,
        description: formData.businessDescription,
        service_type: formData.serviceType,
        service_name: formData.serviceName,
        phone: formData.phoneNumber,
        email: formData.email,
        address: {
          street: formData.address,
          city: formData.address.split(',')[0] || 'Default City', // Extract city from address or provide default
          state: formData.state,
          zipCode: formData.pincode,
          country: formData.country // Use selected country
        },
        currency: formData.country === 'USA' ? 'USD' : 'INR', // Set currency based on country
        opening_time: hourRows.length > 0 ? hourRows[0].openingTime.format('HH:mm') : '09:00',
        closing_time: hourRows.length > 0 ? hourRows[0].closingTime.format('HH:mm') : '17:00',
        status: 'active',
        businessHours: hourRows.map(hour => ({
          day: hour.day,
          openingTime: hour.openingTime.format('HH:mm'),
          closingTime: hour.closingTime.format('HH:mm'),
        }))
      };

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
      // More specific error handling
      if (error.status === 401) {
        message.error('Session expired. Please log in again.');
      } else if (error.status === 409) {
        message.error('A business profile already exists for this account.');
      } else {
        message.error(error.message || 'Failed to create/update provider profile. Please try again.');
      }
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
      render: (_: any, record: BusinessHour, index: number) => {
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
      render: (_: any, record: BusinessHour, index: number) => {
        // Debug logging for opening time
        if (process.env.NODE_ENV === 'development') {
          console.log(`Opening TimePicker render for ${record.day} (index ${index}):`, {
            value: record.openingTime,
            isValid: dayjs.isDayjs(record.openingTime) ? record.openingTime.isValid() : false,
            formatted: dayjs.isDayjs(record.openingTime) && record.openingTime.isValid() ? record.openingTime.format('HH:mm') : 'invalid'
          });
        }
        
        // Only pass valid dayjs objects to TimePicker
        const validOpeningTime = dayjs.isDayjs(record.openingTime) && record.openingTime.isValid() 
          ? record.openingTime 
          : null;
        
        return (
          <TimePicker
            value={validOpeningTime}
            onChange={(value) => {
              if (value) {
                updateHourRow(index, 'openingTime', value);
              }
            }}
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
      render: (_: any, record: BusinessHour, index: number) => {
        // Debug logging for closing time
        if (process.env.NODE_ENV === 'development') {
          console.log(`Closing TimePicker render for ${record.day} (index ${index}):`, {
            value: record.closingTime,
            isValid: dayjs.isDayjs(record.closingTime) ? record.closingTime.isValid() : false,
            formatted: dayjs.isDayjs(record.closingTime) && record.closingTime.isValid() ? record.closingTime.format('HH:mm') : 'invalid'
          });
        }
        
        // Only pass valid dayjs objects to TimePicker
        const validClosingTime = dayjs.isDayjs(record.closingTime) && record.closingTime.isValid() 
          ? record.closingTime 
          : null;
        
        return (
          <TimePicker
            value={validClosingTime}
            onChange={(value) => {
              if (value) {
                updateHourRow(index, 'closingTime', value);
              }
            }}
            format="HH:mm"
            style={{ width: '100%' }}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BusinessHour, index: number) => {
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
        
        {/* Step 1: Basic Information or Business Hours */}
        {currentStep === 0 && (
          showOnlyBusinessHours ? (
            // Business Hours Form (when in business hours only mode)
            <div>
              <Paragraph>
                Set your business hours for each day of the week
              </Paragraph>
              
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
            </div>
          ) : (
            // Basic Information Form (when in full onboarding mode)
            <Form
              form={basicForm}
              layout="vertical"
              initialValues={{
                fullName: formData.fullName,
                email: formData.email,
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
            </Form>
          )
        )}
        
        {/* Step 2: Business Information (only shown in full onboarding mode) */}
        {!showOnlyBusinessHours && currentStep === 1 && (
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
            
            <Form.Item
              label="Service Type"
              name="serviceType"
              rules={[{ required: true, message: 'Please select a service type' }]}
            >
              <Select 
                placeholder="Select your service type" 
                size="large"
                options={[
                  { value: 'massage', label: 'Massage Therapy' },
                  { value: 'spa', label: 'Spa Services' },
                  { value: 'wellness', label: 'Wellness Programs' }, // Updated to match requirement
                  { value: 'corporate', label: 'Corporate Wellness' }
                ]}
              />
            </Form.Item>
            
            <Form.Item
              label="Service Name"
              name="serviceName"
              rules={[{ required: true, message: 'Please select a service name' }]}
            >
              <Select 
                placeholder="Select your service" 
                size="large"
                showSearch
                optionFilterProp="children"
                options={[
                  { value: 'Swedish Massage', label: 'Swedish Massage' },
                  { value: 'Deep Tissue Massage', label: 'Deep Tissue Massage' },
                  { value: 'Aromatherapy Massage', label: 'Aromatherapy Massage' },
                  { value: 'Hot Stone Massage', label: 'Hot Stone Massage' },
                  { value: 'Thai Massage', label: 'Thai Massage' },
                  { value: 'Reflexology (Foot Massage)', label: 'Reflexology (Foot Massage)' },
                  { value: 'Head, Neck & Shoulder Massage', label: 'Head, Neck & Shoulder Massage' },
                  { value: 'Facial Treatments (Basic / Advanced)', label: 'Facial Treatments (Basic / Advanced)' },
                  { value: 'Body Scrub & Body Polishing', label: 'Body Scrub & Body Polishing' },
                  { value: 'Body Wrap Therapy', label: 'Body Wrap Therapy' },
                  { value: 'Manicure & Pedicure', label: 'Manicure & Pedicure' },
                  { value: 'Hair Spa Treatment', label: 'Hair Spa Treatment' },
                  { value: 'Meditation & Mindfulness Programs', label: 'Meditation & Mindfulness Programs' },
                  { value: 'Weight Management Programs', label: 'Weight Management Programs' },
                  { value: 'Stress Management Therapy', label: 'Stress Management Therapy' },
                  { value: 'Detox & Lifestyle Improvement Programs', label: 'Detox & Lifestyle Improvement Programs' },
                  { value: 'Mental Wellness Counseling', label: 'Mental Wellness Counseling' },
                  { value: 'Sleep Improvement Programs', label: 'Sleep Improvement Programs' }
                ]}
              />
            </Form.Item>
          </Form>
        )}
        
        {/* Step 3: Location Information (only shown in full onboarding mode) */}
        {!showOnlyBusinessHours && currentStep === 2 && (
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
                  label="Country"
                  name="country"
                  rules={[
                    { required: true, message: 'Please select your country' }
                  ]}
                >
                  <Select 
                    placeholder="Select your country" 
                    size="large"
                    options={[
                      { value: 'USA', label: 'United States' },
                      { value: 'India', label: 'India' },
                      // Add more countries as needed
                    ]}
                  />
                </Form.Item>
              </Col>
              
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
            </Row>
            
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
          </Form>
        )}
        
        {/* Step 4: Business Hours (moved to step 1 in business hours only mode) */}
        {/* This step is now handled in the currentStep === 0 conditional above */}
        {!showOnlyBusinessHours && currentStep === 3 && (
          <div>
            <Paragraph>
              Set your business hours for each day of the week
            </Paragraph>
            
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
          </div>
        )}
        
        {/* Step 5: Final Setup (only shown in full onboarding mode) */}
        {!showOnlyBusinessHours && currentStep === 4 && (
          <div>
            <Title level={4} style={{ marginBottom: '24px' }}>
              Review Your Information
            </Title>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Basic Information</Title>
              <Paragraph><strong>Name:</strong> {formData.fullName}</Paragraph>
              <Paragraph><strong>Email:</strong> {formData.email}</Paragraph>
              <Paragraph><strong>Phone:</strong> {formData.phoneNumber}</Paragraph>
            </Card>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Business Information</Title>
              <Paragraph><strong>Business Name:</strong> {formData.businessName}</Paragraph>
              <Paragraph><strong>Description:</strong> {formData.businessDescription}</Paragraph>
            </Card>
            
            <Card style={{ marginBottom: '16px' }}>
              <Title level={5}>Location Information</Title>
              <Paragraph><strong>Country:</strong> {formData.country}</Paragraph>
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
          {/* Show Previous button only in full onboarding mode */}
          {!showOnlyBusinessHours && (
            <Button 
              disabled={currentStep === 0} 
              onClick={handlePrev}
              size="large"
            >
              Previous
            </Button>
          )}
          
          {/* In business hours only mode, show Save button */}
          {showOnlyBusinessHours ? (
            <Button 
              type="primary" 
              onClick={handleNext}
              size="large"
              loading={submitting}
            >
              Save Business Hours
            </Button>
          ) : currentStep < 4 ? (
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