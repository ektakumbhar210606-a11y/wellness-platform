'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Layout, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Divider, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Spin,
  Alert,
  Skeleton
} from 'antd';
import moment from 'moment';
import type { Moment } from 'moment';
import { 
  EditOutlined, 
  SaveOutlined, 
  LeftOutlined, 
  HomeOutlined, 
  IdcardOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  FieldNumberOutlined,
  TeamOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';

const { Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Create a focused profile layout for better UX
const ProfileLayout: React.FC<{
  loading?: boolean;
  headerText: string;
  showHome?: boolean;
  backHomeRoute?: string;
  backArrowCallback?: () => void;
  className?: string;
  extraContent?: React.ReactNode;
  children: React.ReactNode; // Add children prop
}> = ({
  headerText = "",
  extraContent = <div className="none hidden d-hide" aria-label="H5UI-APP-ALLOY-IN-HDS hidden">nMnhdry</div> as any,
  showHome = false,
  backHomeRoute = "/",
  backArrowCallback,
  className = "",
  loading = false,
  children,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Layout className={`min-h-screen ${className}`}>
      <Header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => {
                if (backArrowCallback) {
                  backArrowCallback();
                } else {
                  router.push(backHomeRoute);
                }
              }}
            >
              Back
            </Button>
            {showHome && (
              <Button
                type="text"
                icon={<HomeOutlined />}
                onClick={() => router.push(backHomeRoute)}
              >
                Home
              </Button>
            )}
          </div>
          <div className="ml-6">
            <Title level={4} className="mb-0">{headerText}</Title>
            {user && (
              <Text type="secondary" className="text-sm">
                {user.name || 'User Profile'}
              </Text>
            )}
          </div>
        </div>
        {extraContent}
      </Header>
      <Content className="p-6 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          children
        )}
      </Content>
    </Layout>
  );
};

const CustomerProfilePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      await fetchCustomerProfile();
      setLoading(false);
    };

    checkAccess();
  }, [user, router]);

  const fetchCustomerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCustomerProfile(result.data);
      } else {
        throw new Error('Invalid profile data received');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    }
  };

  const openEditProfileModal = () => {
    if (customerProfile) {
      editingForm.setFieldsValue({
        fullName: customerProfile.fullName,
        email: customerProfile.email,
        phoneNumber: customerProfile.phoneNumber,
        dateOfBirth: customerProfile.dateOfBirth ? moment(new Date(customerProfile.dateOfBirth)) : null,
        gender: customerProfile.gender,
        city: customerProfile.location?.city,
        state: customerProfile.location?.state,
        country: customerProfile.location?.country,
        zipCode: customerProfile.location?.zipCode,
        wellnessGoals: customerProfile.wellnessGoals,
        stressLevel: customerProfile.stressLevel,
        appointmentFrequency: customerProfile.appointmentFrequency,
        preferredTimeSlots: customerProfile.preferredTimeSlots,
        lifestyleFactors: customerProfile.lifestyleFactors,
        medicalNotes: customerProfile.medicalInfo?.notes,
        preferences: customerProfile.preferences ? customerProfile.preferences.map((p: any) => p.value) : [],
        preferredTherapies: customerProfile.preferredTherapies
      });
    }
    setIsEditModalVisible(true);
  };

  const closeEditProfileModal = () => {
    setIsEditModalVisible(false);
    editingForm.resetFields();
  };

  const handleEditProfileSubmit = async () => {
    try {
      setIsEditing(true);
      const values = await editingForm.validateFields();

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const updateData = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
        gender: values.gender,
        location: {
          city: values.city,
          state: values.state,
          country: values.country,
          zipCode: values.zipCode
        },
        wellnessGoals: values.wellnessGoals,
        stressLevel: values.stressLevel,
        appointmentFrequency: values.appointmentFrequency,
        preferredTimeSlots: values.preferredTimeSlots || [],
        lifestyleFactors: values.lifestyleFactors || [],
        medicalInfo: {
          notes: values.medicalNotes
        },
        preferences: values.preferences ? values.preferences.map((pref: string) => ({
          type: 'service',
          value: pref,
          category: 'general'
        })) : [],
        preferredTherapies: values.preferredTherapies || []
      };

      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      if (result.success) {
        setCustomerProfile((prev: any) => ({
          ...prev,
          ...updateData,
          location: {
            ...prev.location,
            ...updateData.location
          },
          medicalInfo: {
            ...prev.medicalInfo,
            ...updateData.medicalInfo
          }
        }));

        closeEditProfileModal();
        // Show success message
        alert('Profile updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <ProfileLayout loading={true} headerText="Loading Profile...">
        <div className="none hidden d-hide" aria-label="H5UI-APP-ALLOY-IN-HDS hidden">nMnhdry</div>
      </ProfileLayout>
    );
  }

  if (error) {
    return (
      <ProfileLayout headerText="Profile Error">
        <Card>
          <Alert
            message="Error Loading Profile"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        </Card>
      </ProfileLayout>
    );
  }

  if (!customerProfile) {
    return (
      <ProfileLayout headerText="Profile Not Found">
        <Card>
          <Alert
            message="Profile Not Found"
            description="No profile data available. Please try again later."
            type="warning"
            showIcon
          />
        </Card>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout
      headerText="My Profile"
      backHomeRoute="/dashboard/customer"
      extraContent={
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={openEditProfileModal}
        >
          Edit Profile
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto">
        {/* Personal Information Section */}
        <Card className="mb-6 shadow-sm" title={
          <div className="flex items-center">
            <IdcardOutlined className="mr-2 text-blue-500" />
            <span>Personal Information</span>
          </div>
        }>
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="middle">
            <Descriptions.Item label="Full Name" span={{ xs: 1, sm: 2, md: 2 }}>
              {customerProfile.fullName || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {customerProfile.email || 'Not provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone Number">
              {customerProfile.phoneNumber || 'Not provided'}
            </Descriptions.Item>
            {customerProfile.dateOfBirth && (
              <Descriptions.Item label="Date of Birth">
                {new Date(customerProfile.dateOfBirth).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Descriptions.Item>
            )}
            {customerProfile.gender && (
              <Descriptions.Item label="Gender">
                <Tag color={
                  customerProfile.gender === 'male' ? 'blue' :
                  customerProfile.gender === 'female' ? 'pink' : 'default'
                }>
                  {customerProfile.gender.charAt(0).toUpperCase() + customerProfile.gender.slice(1)}
                </Tag>
              </Descriptions.Item>
            )}
            {(customerProfile.location?.city || customerProfile.location?.state || customerProfile.location?.country) && (
              <Descriptions.Item label="Location" span={{ xs: 1, sm: 2, md: 3 }}>
                {[customerProfile.location?.city, customerProfile.location?.state, customerProfile.location?.country]
                  .filter(Boolean)
                  .join(', ') || 'Not provided'}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Wellness & Preferences Section */}
        <Card className="mb-6 shadow-sm" title={
          <div className="flex items-center">
            <SettingOutlined className="mr-2 text-green-500" />
            <span>Wellness & Preferences</span>
          </div>
        }>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Wellness Goals" className="h-full">
                {customerProfile.wellnessGoals ? (
                  <Paragraph className="mb-0">{customerProfile.wellnessGoals}</Paragraph>
                ) : (
                  <Text type="secondary">No wellness goals set</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Stress Level" className="h-full">
                {customerProfile.stressLevel ? (
                  <Tag 
                    color={
                      customerProfile.stressLevel === 'low' ? 'green' :
                      customerProfile.stressLevel === 'moderate' ? 'orange' :
                      customerProfile.stressLevel === 'high' ? 'red' : 'volcano'
                    }
                    className="text-base px-3 py-1"
                  >
                    {customerProfile.stressLevel.charAt(0).toUpperCase() + customerProfile.stressLevel.slice(1)}
                  </Tag>
                ) : (
                  <Text type="secondary">Not specified</Text>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Appointment Frequency" className="h-full">
                {customerProfile.appointmentFrequency ? (
                  <Text>
                    {customerProfile.appointmentFrequency.charAt(0).toUpperCase() + 
                     customerProfile.appointmentFrequency.slice(1).replace(/-/g, ' ')}
                  </Text>
                ) : (
                  <Text type="secondary">Not specified</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Preferred Time Slots" className="h-full">
                {customerProfile.preferredTimeSlots && customerProfile.preferredTimeSlots.length > 0 ? (
                  <Space wrap>
                    {customerProfile.preferredTimeSlots.map((slot: string, index: number) => (
                      <Tag key={index} color="blue">
                        {slot.charAt(0).toUpperCase() + slot.slice(1)}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No preferences set</Text>
                )}
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Service Preferences Section */}
        <Card className="mb-6 shadow-sm" title={
          <div className="flex items-center">
            <TeamOutlined className="mr-2 text-purple-500" />
            <span>Service Preferences</span>
          </div>
        }>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Service Preferences" className="h-full">
                {customerProfile.preferences && customerProfile.preferences.length > 0 ? (
                  <Space wrap>
                    {customerProfile.preferences.map((pref: any, index: number) => (
                      <Tag key={index} color="purple">
                        {pref.value}{pref.category ? ` (${pref.category})` : ''}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No preferences set</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Preferred Therapies" className="h-full">
                {customerProfile.preferredTherapies && customerProfile.preferredTherapies.length > 0 ? (
                  <Space wrap>
                    {customerProfile.preferredTherapies.map((therapy: string, index: number) => (
                      <Tag key={index} color="cyan">
                        {therapy.charAt(0).toUpperCase() + therapy.slice(1).replace(/-/g, ' ')}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No preferred therapies set</Text>
                )}
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Lifestyle & Medical Section */}
        <Card className="mb-6 shadow-sm" title={
          <div className="flex items-center">
            <UserAddOutlined className="mr-2 text-orange-500" />
            <span>Lifestyle & Medical Information</span>
          </div>
        }>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Lifestyle Factors" className="h-full">
                {customerProfile.lifestyleFactors && customerProfile.lifestyleFactors.length > 0 ? (
                  <Space wrap>
                    {customerProfile.lifestyleFactors.map((factor: string, index: number) => (
                      <Tag key={index} color="gold">
                        {factor.charAt(0).toUpperCase() + factor.slice(1).replace(/-/g, ' ')}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No lifestyle factors specified</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Medical Information" className="h-full">
                {customerProfile.medicalInfo?.notes ? (
                  <div>
                    <Text strong>Notes:</Text>
                    <Paragraph className="mb-1 italic text-gray-600">
                      {customerProfile.medicalInfo.notes}
                    </Paragraph>
                    <Text type="secondary" className="text-xs">
                      Last updated: {customerProfile.medicalInfo.lastUpdated ? 
                        new Date(customerProfile.medicalInfo.lastUpdated).toLocaleDateString('en-US') : 
                        'Not recorded'}
                    </Text>
                  </div>
                ) : (
                  <Text type="secondary">No medical information provided</Text>
                )}
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Edit Profile Modal */}
        <Modal
          title={
            <div className="flex items-center">
              <EditOutlined className="mr-2" />
              <span>Edit Profile Information</span>
            </div>
          }
          open={isEditModalVisible}
          onCancel={closeEditProfileModal}
          onOk={handleEditProfileSubmit}
          okText={
            <span>
              <SaveOutlined className="mr-1" />
              Save Changes
            </span>
          }
          cancelText="Cancel"
          width={900}
          confirmLoading={isEditing}
          maskClosable={false}
        >
          <Form
            form={editingForm}
            layout="vertical"
            initialValues={{
              preferences: [],
              preferredTherapies: [],
              preferredTimeSlots: [],
              lifestyleFactors: []
            }}
          >
            <Divider>Personal Details</Divider>
            
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
                  rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phoneNumber"
                  label="Phone Number"
                >
                  <Input placeholder="Enter your phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dateOfBirth"
                  label="Date of Birth"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="gender"
                  label="Gender"
                >
                  <Select placeholder="Select your gender">
                    <Select.Option value="male">Male</Select.Option>
                    <Select.Option value="female">Female</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                    <Select.Option value="prefer-not-to-say">Prefer not to say</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="stressLevel"
                  label="Current Stress Level"
                >
                  <Select placeholder="Select stress level">
                    <Select.Option value="low">Low</Select.Option>
                    <Select.Option value="moderate">Moderate</Select.Option>
                    <Select.Option value="high">High</Select.Option>
                    <Select.Option value="very-high">Very High</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider>Location</Divider>
            
            <Form.Item
              name="city"
              label="City"
            >
              <Input placeholder="Enter your city" />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="state"
                  label="State"
                >
                  <Input placeholder="Enter your state" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label="Country"
                >
                  <Input placeholder="Enter your country" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="zipCode"
              label="ZIP Code"
            >
              <Input placeholder="Enter your ZIP code" />
            </Form.Item>

            <Divider>Wellness & Preferences</Divider>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="appointmentFrequency"
                  label="Appointment Frequency"
                >
                  <Select placeholder="How often do you book appointments?">
                    <Select.Option value="weekly">Weekly</Select.Option>
                    <Select.Option value="bi-weekly">Bi-weekly</Select.Option>
                    <Select.Option value="monthly">Monthly</Select.Option>
                    <Select.Option value="occasional">Occasionally</Select.Option>
                    <Select.Option value="first-time">First time trying</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="preferredTimeSlots"
                  label="Preferred Time Slots"
                >
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Select your preferred time slots"
                  >
                    <Select.Option value="morning">Morning (8am-12pm)</Select.Option>
                    <Select.Option value="afternoon">Afternoon (12pm-5pm)</Select.Option>
                    <Select.Option value="evening">Evening (5pm-9pm)</Select.Option>
                    <Select.Option value="weekend">Weekend</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="wellnessGoals"
              label="Wellness Goals"
            >
              <TextArea 
                rows={3} 
                placeholder="Share your wellness goals and what you hope to achieve through our services" 
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="preferences"
                  label="Service Preferences"
                >
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select your service preferences (press Enter to add)"
                    tokenSeparators={[',']}
                  >
                    <Select.Option value="massage">Massage Therapy</Select.Option>
                    <Select.Option value="spa">Spa Services</Select.Option>
                    <Select.Option value="wellness">Wellness Programs</Select.Option>
                    <Select.Option value="yoga">Yoga Classes</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="preferredTherapies"
                  label="Preferred Therapies"
                >
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select preferred therapies (press Enter to add)"
                    tokenSeparators={[',']}
                  >
                    <Select.Option value="swedish-massage">Swedish Massage</Select.Option>
                    <Select.Option value="deep-tissue-massage">Deep Tissue Massage</Select.Option>
                    <Select.Option value="aromatherapy-massage">Aromatherapy Massage</Select.Option>
                    <Select.Option value="hot-stone-massage">Hot Stone Massage</Select.Option>
                    <Select.Option value="thai-massage">Thai Massage</Select.Option>
                    <Select.Option value="reflexology-foot-massage">Reflexology (Foot Massage)</Select.Option>
                    <Select.Option value="head-neck-shoulder-massage">Head, Neck & Shoulder Massage</Select.Option>
                    <Select.Option value="facial-treatments">Facial Treatments (Basic / Advanced)</Select.Option>
                    <Select.Option value="body-scrub-polishing">Body Scrub & Body Polishing</Select.Option>
                    <Select.Option value="body-wrap-therapy">Body Wrap Therapy</Select.Option>
                    <Select.Option value="manicure-pedicure">Manicure & Pedicure</Select.Option>
                    <Select.Option value="hair-spa-treatment">Hair Spa Treatment</Select.Option>
                    <Select.Option value="meditation-mindfulness">Meditation & Mindfulness Programs</Select.Option>
                    <Select.Option value="weight-management">Weight Management Programs</Select.Option>
                    <Select.Option value="stress-management-therapy">Stress Management Therapy</Select.Option>
                    <Select.Option value="detox-lifestyle-improvement">Detox & Lifestyle Improvement Programs</Select.Option>
                    <Select.Option value="mental-wellness-counseling">Mental Wellness Counseling</Select.Option>
                    <Select.Option value="sleep-improvement-programs">Sleep Improvement Programs</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="lifestyleFactors"
                  label="Lifestyle Factors"
                >
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Select lifestyle factors that apply (press Enter to add)"
                    tokenSeparators={[',']}
                  >
                    <Select.Option value="sedentary">Mostly sedentary</Select.Option>
                    <Select.Option value="moderately-active">Moderately active</Select.Option>
                    <Select.Option value="very-active">Very active</Select.Option>
                    <Select.Option value="office-worker">Office worker</Select.Option>
                    <Select.Option value="shift-work">Shift work</Select.Option>
                    <Select.Option value="travel-frequent">Travel frequently</Select.Option>
                    <Select.Option value="family-oriented">Family oriented</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="medicalNotes"
                  label="Medical Notes"
                >
                  <TextArea 
                    rows={2} 
                    placeholder="Any medical conditions, allergies, or health concerns we should be aware of" 
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </ProfileLayout>
  );
};

export default CustomerProfilePage;