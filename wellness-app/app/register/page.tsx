'use client';

import React, { useState } from 'react';
import { 
  UserOutlined, 
  TeamOutlined, 
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Typography, 
  message, 
  Steps, 
  Row, 
  Col, 
  Select,
  Upload,
  TimePicker,
  Checkbox,
  Divider
} from 'antd';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

// Define user role types
type UserRole = 'customer' | 'provider' | 'therapist';

// Define form steps for each role
type FormStep = 'personal' | 'business' | 'professional' | 'services' | 'team' | 'review';

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Get role from URL if available
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role && ['customer', 'provider', 'therapist'].includes(role)) {
      setSelectedRole(role as UserRole);
    }
  }, []);

  // Define steps based on selected role
  const getSteps = () => {
    switch(selectedRole) {
      case 'customer':
        return [
          { title: 'Personal Info', description: 'Your basic details' },
        ];
      case 'provider':
        return [
          { title: 'Personal Info', description: 'Your details' },
          { title: 'Business Info', description: 'Business details' },
          { title: 'Location & Hours', description: 'Address and schedule' },
          { title: 'Services', description: 'Showcase your offerings' },
          { title: 'Team', description: 'Add team members' },
        ];
      case 'therapist':
        return [
          { title: 'Personal Info', description: 'Your details' },
          { title: 'Professional Info', description: 'Professional details' },
          { title: 'Skills & Availability', description: 'Skills and schedule' },
        ];
      default:
        return [];
    }
  };

  const steps = getSteps();

  // Handle form submission
  const onFinish = async () => {
    setLoading(true);
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Registration successful! Please check your email to verify your account.');
      console.log('Registration values:', form.getFieldsValue());
      // In a real app, you would redirect to login or dashboard
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render current step form based on role
  const renderCurrentStep = () => {
    if (!selectedRole) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Please select an account type to continue
          </Text>
        </div>
      );
    }

    switch(selectedRole) {
      case 'customer':
        return renderCustomerStep();
      case 'provider':
        return renderProviderStep();
      case 'therapist':
        return renderTherapistStep();
      default:
        return null;
    }
  };

  // Customer form step
  const renderCustomerStep = () => {
    return (
      <Form
        form={form}
        name="customer_form"
        layout="vertical"
        size="large"
        style={{ maxWidth: '600px', margin: '0 auto' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Please input your name!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                placeholder="Enter your full name" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email address!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#667eea' }} />} 
                placeholder="Enter your email" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[{ required: true, message: 'Please input your phone number!' }]}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#667eea' }} />} 
                placeholder="Enter your phone number" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#667eea' }} />}
                placeholder="Enter your password"
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  };

  // Provider form steps
  const renderProviderStep = () => {
    switch(currentStep) {
      case 0: // Personal Info
        return (
          <Form
            form={form}
            name="provider_personal_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[{ required: true, message: 'Please input your name!' }]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your full name" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email address!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your email" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[{ required: true, message: 'Please input your phone number!' }]}
                >
                  <Input 
                    prefix={<PhoneOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your phone number" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#667eea' }} />}
                    placeholder="Enter your password"
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        );
      case 1: // Business Info
        return (
          <Form
            form={form}
            name="provider_business_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.Item
              label="Business Name"
              name="businessName"
              rules={[{ required: true, message: 'Please input your business name!' }]}
            >
              <Input 
                prefix={<ShopOutlined style={{ color: '#667eea' }} />} 
                placeholder="Enter your business name" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>

            <Form.Item
              label="Business Description"
              name="businessDescription"
              rules={[{ required: true, message: 'Please provide a business description!' }]}
            >
              <Input.TextArea 
                rows={4}
                placeholder="Describe your business and services" 
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              label="Business Type"
              name="businessType"
              rules={[{ required: true, message: 'Please select your business type!' }]}
            >
              <Select
                placeholder="Select business type"
                style={{ borderRadius: '8px', height: '48px' }}
                options={[
                  { label: 'Spa', value: 'spa' },
                  { label: 'Massage Therapy', value: 'massage' },
                  { label: 'Wellness Center', value: 'wellness' },
                  { label: 'Yoga Studio', value: 'yoga' },
                  { label: 'Fitness Center', value: 'fitness' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </Form.Item>
          </Form>
        );
      case 2: // Location & Hours
        return (
          <Form
            form={form}
            name="provider_location_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.Item
              label="Street Address"
              name="streetAddress"
              rules={[{ required: true, message: 'Please input your street address!' }]}
            >
              <Input 
                prefix={<HomeOutlined style={{ color: '#667eea' }} />} 
                placeholder="Enter your street address" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="City"
                  name="city"
                  rules={[{ required: true, message: 'Please input your city!' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your city" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="State"
                  name="state"
                  rules={[{ required: true, message: 'Please input your state!' }]}
                >
                  <Input 
                    placeholder="State" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="Pincode"
                  name="pincode"
                  rules={[{ required: true, message: 'Please input your pincode!' }]}
                >
                  <Input 
                    placeholder="Pincode" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Opening Hours</Divider>
            
            <Form.Item label="Monday - Friday">
              <Row gutter={8}>
                <Col span={11}>
                  <Form.Item name="monFriOpen" noStyle>
                    <TimePicker 
                      style={{ width: '100%' }} 
                      placeholder="Open time" 
                      format="HH:mm"
                    />
                  </Form.Item>
                </Col>
                <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                  to
                </Col>
                <Col span={11}>
                  <Form.Item name="monFriClose" noStyle>
                    <TimePicker 
                      style={{ width: '100%' }} 
                      placeholder="Close time" 
                      format="HH:mm"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label="Saturday">
              <Row gutter={8}>
                <Col span={11}>
                  <Form.Item name="satOpen" noStyle>
                    <TimePicker 
                      style={{ width: '100%' }} 
                      placeholder="Open time" 
                      format="HH:mm"
                    />
                  </Form.Item>
                </Col>
                <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                  to
                </Col>
                <Col span={11}>
                  <Form.Item name="satClose" noStyle>
                    <TimePicker 
                      style={{ width: '100%' }} 
                      placeholder="Close time" 
                      format="HH:mm"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label="Sunday">
              <Form.Item name="sundayClosed" valuePropName="checked" noStyle>
                <Checkbox>Closed on Sunday</Checkbox>
              </Form.Item>
              {!form.getFieldValue('sundayClosed') && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="sunOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Open time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="sunClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Close time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>
          </Form>
        );
      case 3: // Services
        return (
          <Form
            form={form}
            name="provider_services_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.Item
              label="Showcase Images"
              name="showcaseImages"
            >
              <Upload
                multiple
                listType="picture"
                maxCount={5}
                beforeUpload={() => false} // Prevent automatic upload
              >
                <Button icon={<UploadOutlined />}>Upload Images</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label="Spa Images"
              name="spaImages"
            >
              <Upload
                multiple
                listType="picture"
                maxCount={5}
                beforeUpload={() => false} // Prevent automatic upload
              >
                <Button icon={<UploadOutlined />}>Upload Spa Images</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label="Services Offered"
              name="services"
            >
              <Select
                mode="tags"
                placeholder="Add services offered (e.g., Massage, Facial, etc.)"
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Form>
        );
      case 4: // Team
        return (
          <Form
            form={form}
            name="provider_team_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.List name="teamMembers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card 
                      key={key} 
                      style={{ marginBottom: '16px' }} 
                      title={`Team Member ${key + 1}`}
                      extra={
                        <Button 
                          type="text" 
                          danger 
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Full Name"
                            rules={[{ required: true, message: 'Name is required' }]}
                          >
                            <Input 
                              prefix={<UserAddOutlined style={{ color: '#667eea' }} />} 
                              placeholder="Full name" 
                              style={{ borderRadius: '8px', height: '48px' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'position']}
                            label="Position"
                            rules={[{ required: true, message: 'Position is required' }]}
                          >
                            <Input 
                              placeholder="Position/Role" 
                              style={{ borderRadius: '8px', height: '48px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        {...restField}
                        name={[name, 'specialties']}
                        label="Specialties"
                      >
                        <Select
                          mode="tags"
                          placeholder="Add specialties"
                          style={{ borderRadius: '8px', height: '48px' }}
                        />
                      </Form.Item>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      block
                      icon={<UserAddOutlined />}
                    >
                      Add Team Member
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        );
      default:
        return null;
    }
  };

  // Therapist form steps
  const renderTherapistStep = () => {
    switch(currentStep) {
      case 0: // Personal Info
        return (
          <Form
            form={form}
            name="therapist_personal_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[{ required: true, message: 'Please input your name!' }]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your full name" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email address!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your email" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[{ required: true, message: 'Please input your phone number!' }]}
                >
                  <Input 
                    prefix={<PhoneOutlined style={{ color: '#667eea' }} />} 
                    placeholder="Enter your phone number" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#667eea' }} />}
                    placeholder="Enter your password"
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        );
      case 1: // Professional Info
        return (
          <Form
            form={form}
            name="therapist_professional_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.Item
              label="Professional Title"
              name="professionalTitle"
              rules={[{ required: true, message: 'Please input your professional title!' }]}
            >
              <Input 
                prefix={<ProfileOutlined style={{ color: '#667eea' }} />} 
                placeholder="e.g., Licensed Massage Therapist, Yoga Instructor" 
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>

            <Form.Item
              label="Professional Bio"
              name="professionalBio"
              rules={[{ required: true, message: 'Please provide your professional bio!' }]}
            >
              <Input.TextArea 
                rows={4}
                placeholder="Tell us about your professional background and expertise" 
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Years of Experience"
                  name="yearsOfExperience"
                  rules={[{ required: true, message: 'Please input your years of experience!' }]}
                >
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Years of experience" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Location"
                  name="location"
                  rules={[{ required: true, message: 'Please input your location!' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined style={{ color: '#667eea' }} />} 
                    placeholder="City, State" 
                    style={{ borderRadius: '8px', height: '48px' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Certifications"
              name="certifications"
            >
              <Select
                mode="tags"
                placeholder="Add your certifications"
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>
          </Form>
        );
      case 2: // Skills & Availability
        return (
          <Form
            form={form}
            name="therapist_skills_form"
            layout="vertical"
            size="large"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <Form.Item
              label="Your Skills"
              name="skills"
              rules={[{ required: true, message: 'Please add your skills!' }]}
            >
              <Select
                mode="tags"
                placeholder="Add your skills (e.g., Swedish Massage, Deep Tissue, etc.)"
                style={{ borderRadius: '8px', height: '48px' }}
              />
            </Form.Item>

            <Divider>Weekly Availability</Divider>
            
            <Form.Item label="Monday">
              <Form.Item name="mondayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['mondayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="monOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="monClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Tuesday">
              <Form.Item name="tuesdayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['tuesdayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="tueOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="tueClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Wednesday">
              <Form.Item name="wednesdayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['wednesdayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="wedOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="wedClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Thursday">
              <Form.Item name="thursdayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['thursdayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="thuOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="thuClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Friday">
              <Form.Item name="fridayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['fridayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="friOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="friClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Saturday">
              <Form.Item name="saturdayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['saturdayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="satOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="satClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>

            <Form.Item label="Sunday">
              <Form.Item name="sundayAvailable" valuePropName="checked" noStyle>
                <Checkbox>Available</Checkbox>
              </Form.Item>
              {form.getFieldValue(['sundayAvailable']) && (
                <Row gutter={8} style={{ marginTop: '8px' }}>
                  <Col span={11}>
                    <Form.Item name="sunOpen" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="Start time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2} style={{ textAlign: 'center', lineHeight: '32px' }}>
                    to
                  </Col>
                  <Col span={11}>
                    <Form.Item name="sunClose" noStyle>
                      <TimePicker 
                        style={{ width: '100%' }} 
                        placeholder="End time" 
                        format="HH:mm"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Form.Item>
          </Form>
        );
      default:
        return null;
    }
  };

  // Get step title based on role and step
  const getStepTitle = () => {
    if (!selectedRole) return '';
    
    switch(selectedRole) {
      case 'customer':
        return 'Personal Information';
      case 'provider':
        const providerSteps = [
          'Personal Information',
          'Business Information', 
          'Location & Hours',
          'Services',
          'Team Members'
        ];
        return providerSteps[currentStep] || '';
      case 'therapist':
        const therapistSteps = [
          'Personal Information',
          'Professional Information',
          'Skills & Availability'
        ];
        return therapistSteps[currentStep] || '';
      default:
        return '';
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <Card
          variant="borderless"
          style={{
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: '40px 32px' } }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div 
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '16px',
              }}
            >
              🧘‍♀️ Serenity
            </div>
            <Title level={2} style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>
              {selectedRole ? `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : 'Create Your Account'}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {selectedRole 
                ? `Step ${currentStep + 1} of ${steps.length}: ${getStepTitle()}` 
                : 'Join our wellness community today'}
            </Text>
          </div>

          {selectedRole && steps.length > 0 && (
            <>
              <Steps 
                current={currentStep} 
                items={steps.map((step, index) => ({
                  title: step.title,
                  description: step.description,
                  icon: selectedRole === 'customer' ? <UserOutlined /> : 
                         selectedRole === 'provider' ? <ShopOutlined /> : 
                         <TeamOutlined />
                }))}
                style={{ marginBottom: '32px' }}
              />
              
              <div style={{ minHeight: '300px', marginBottom: '32px' }}>
                {renderCurrentStep()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  size="large"
                  disabled={currentStep === 0}
                  onClick={prevStep}
                  style={{
                    borderRadius: '8px',
                    height: '48px',
                  }}
                >
                  Previous
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={nextStep}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderColor: 'transparent',
                      fontSize: '16px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      height: '48px',
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={onFinish}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderColor: 'transparent',
                      fontSize: '16px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      height: '48px',
                    }}
                  >
                    Complete Registration
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Show role selection if no role is selected */}
          {!selectedRole && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Please select an account type to continue
              </Text>
              <div style={{ marginTop: '24px' }}>
                <Link href="/role-selection">
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderColor: 'transparent',
                      fontSize: '16px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      height: '48px',
                    }}
                  >
                    Go to Role Selection
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {selectedRole && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#667eea', fontWeight: 500 }}>
                  Sign in
                </Link>
              </Text>
            </div>
          )}
        </Card>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
            © {new Date().getFullYear()} Serenity. All rights reserved.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;