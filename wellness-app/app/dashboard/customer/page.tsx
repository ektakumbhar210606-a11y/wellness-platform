'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Layout, Menu, Button, Space, Typography, Row, Col, Statistic, Avatar, Tabs, Skeleton, Result, Alert, Descriptions, Tag, Divider, Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import moment from 'moment';
import type { Moment } from 'moment';
import { 
  UserOutlined, 
  CalendarOutlined, 
  BookOutlined, 
  HeartOutlined, 
  ShoppingCartOutlined,
  StarOutlined,
  ClockCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import CustomerUpcomingAppointmentCard from '@/app/components/CustomerUpcomingAppointmentCard';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface Appointment {
  id: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  } | null;
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  } | null;
  business: {
    id: string;
    name: string;
  } | null;
  date: Date;
  time: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}


const CustomerDashboardPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState({
    appointments: null as number | null,
    upcomingAppointments: null as number | null,
    servicesUsed: null as number | null,
    avgRating: null as number | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [upcomingAppointmentsList, setUpcomingAppointmentsList] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);


  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      // Fetch customer profile from API
      await fetchCustomerProfile();

      // Fetch dashboard statistics
      fetchDashboardStats();
          
      // Fetch upcoming appointments
      fetchUpcomingAppointments();
      
      // Fetch recent activities
      fetchRecentActivities();

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
      
      console.log('Customer profile API response status:', response.status);
      console.log('Customer profile API response headers:', [...response.headers.entries()]);
      
      // Check if response is OK and contains JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Error response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      console.log('Success response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      const result = await response.json();
      console.log('Customer profile API result:', result);
      
      if (result.success && result.data) {
        setCustomerProfile(result.data);
        console.log('Successfully set customer profile:', result.data);
      } else {
        console.warn('Customer profile API returned success=false or no data');
        throw new Error('Invalid customer profile data received');
      }
    } catch (err: any) {
      console.error('Error fetching customer profile:', err);
      // Fallback to user data if API fails
      setCustomerProfile({
        fullName: user?.name || 'Customer',
        email: user?.email || '',
        preferences: [],
        wellnessGoals: ''
      });
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/customer/activities/recent?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recent activities');
      }

      const result = await response.json();
      
      if (result.success && result.data?.activities) {
        // Transform API response to match our display format
        const formattedActivities = result.data.activities.map((activity: any) => ({
          id: activity.id,
          type: activity.type,
          service: activity.service?.name || 'Unknown Service',
          date: new Date(activity.date),
          therapist: activity.therapist?.name || 'Unknown Therapist',
          rating: activity.rating
        }));
        
        setRecentActivities(formattedActivities);
      } else {
        setRecentActivities([]);
      }
    } catch (err: any) {
      console.error('Error fetching recent activities:', err);
      // Fallback to sample data if API fails
      const sampleActivities = [
        {
          id: '1',
          type: 'completed',
          service: 'Initial Consultation',
          date: new Date(Date.now() - 86400000 * 3), // 3 days ago
          therapist: 'Dr. Smith'
        },
        {
          id: '2',
          type: 'booked',
          service: 'Relaxing Massage',
          date: new Date(Date.now() + 86400000 * 2), // 2 days from now
          therapist: 'Sarah Johnson'
        }
      ];
      setRecentActivities(sampleActivities);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      setAppointmentsError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/customer/bookings/upcoming?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch upcoming appointments');
      }

      const result = await response.json();
      if (result.success && result.data?.bookings) {
        setUpcomingAppointmentsList(result.data.bookings);
      }
    } catch (err: any) {
      console.error('Error fetching upcoming appointments:', err);
      setAppointmentsError(err.message || 'Failed to load upcoming appointments');
      setUpcomingAppointmentsList([]);
    } finally {
      setAppointmentsLoading(false);
    };
  };

  const openEditProfileModal = () => {
    // Set the form fields with current customer profile data
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
        // Convert preferences to simple values array for the form
        preferences: customerProfile.preferences ? customerProfile.preferences.map((p: any) => p.value) : [],
        // Convert preferredTherapies to array for the form
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
      
      // Validate the form
      const values = await editingForm.validateFields();
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare the update payload
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
        lifestyleFactors: values.lifestyleFactors,
        medicalInfo: {
          notes: values.medicalNotes
        },
        // Convert preferences back to the required format
        preferences: values.preferences ? values.preferences.map((pref: string) => ({
          type: 'service', // default type
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
        // Update the local customer profile state
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
        // In a real app, you'd use notification instead
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

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/customer/dashboard/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      setDashboardStats({
        appointments: data.appointments,
        upcomingAppointments: data.upcomingAppointments,
        servicesUsed: data.servicesUsed,
        avgRating: data.avgRating,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    }
  };

  const menuItems = [
    {
      key: '1',
      label: 'Profile Overview',
      icon: <UserOutlined />,
      onClick: () => router.push('/dashboard/customer/profile'),
    },
    {
      key: '2',
      label: 'Book Appointment',
      icon: <CalendarOutlined />,
      onClick: () => router.push('/book/appointment'),
    },
    {
      key: '3',
      label: 'My Bookings',
      icon: <BookOutlined />,
      onClick: () => router.push('/dashboard/customer/bookings'),
    },
    {
      key: '4',
      label: 'Favorites',
      icon: <HeartOutlined />,
      onClick: () => console.log('Navigate to favorites'),
    },
    {
      key: '5',
      label: 'Wellness History',
      icon: <ClockCircleOutlined />,
      onClick: () => console.log('Navigate to wellness history'),
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: () => {
        logout();
        router.push('/');
      },
    },
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', textAlign: 'center' }}>
          <Text>Loading dashboard...</Text>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', textAlign: 'center' }}>
          <Card title="Error" style={{ maxWidth: 400, margin: '0 auto' }}>
            <Text type="danger">{error}</Text>
            <div style={{ marginTop: 16 }}>
              <Button 
                type="primary" 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          </Card>
        </Content>
      </Layout>
    );
  }

  if (!customerProfile) {
    return null; // Already redirected in useEffect
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ float: 'left', padding: '0 24px', fontSize: '20px', fontWeight: 'bold', lineHeight: '64px' }}>
          Dashboard
        </div>
        <div style={{ float: 'right', padding: '0 24px', lineHeight: '64px' }}>
          <Space>
            <Text strong>{user?.name || customerProfile.fullName || 'Customer'}</Text>
            <Avatar icon={<UserOutlined />} />
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff', padding: '24px 0' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280, borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={2}>Welcome Back, {customerProfile.fullName || user?.name || 'Customer'}!</Title>
                <Text type="secondary">Here's what's happening with your wellness journey today.</Text>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  {dashboardStats.appointments !== null ? (
                    <Statistic
                      title="Total Appointments"
                      value={dashboardStats.appointments}
                      prefix={<CalendarOutlined />}
                    />
                  ) : (
                    <div style={{ padding: '24px 0' }}>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  {dashboardStats.upcomingAppointments !== null ? (
                    <Statistic
                      title="Upcoming"
                      value={dashboardStats.upcomingAppointments}
                      prefix={<ClockCircleOutlined />}
                    />
                  ) : (
                    <div style={{ padding: '24px 0' }}>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  {dashboardStats.servicesUsed !== null ? (
                    <Statistic
                      title="Services Used"
                      value={dashboardStats.servicesUsed}
                      prefix={<ShoppingCartOutlined />}
                    />
                  ) : (
                    <div style={{ padding: '24px 0' }}>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  {dashboardStats.avgRating !== null ? (
                    <Statistic
                      title="Avg. Rating"
                      value={dashboardStats.avgRating}
                      precision={1}
                      prefix={<StarOutlined />}
                      suffix="/ 5"
                    />
                  ) : (
                    <div style={{ padding: '24px 0' }}>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Tabs 
                  defaultActiveKey="upcoming"
                  items={[{
                    label: 'Upcoming Appointments',
                    key: 'upcoming',
                    children: (
                      <div>
                        {appointmentsLoading ? (
                          <div style={{ padding: '24px 0' }}>
                            <Skeleton active paragraph={{ rows: 4 }} />
                            <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
                          </div>
                        ) : appointmentsError ? (
                          <Alert 
                            message="Failed to load appointments" 
                            description={appointmentsError}
                            type="error" 
                            showIcon
                            action={
                              <Button size="small" type="primary" onClick={() => {
                                setAppointmentsLoading(true);
                                setAppointmentsError(null);
                                // Re-fetch appointments
                                const token = localStorage.getItem('token');
                                if (token) {
                                  fetchUpcomingAppointments();
                                }
                              }}>
                                Retry
                              </Button>
                            }
                          />
                        ) : upcomingAppointmentsList.length > 0 ? (
                          <div>
                            {upcomingAppointmentsList.map(appointment => (
                              <CustomerUpcomingAppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                onReschedule={(id) => {
                                  // TODO: Implement reschedule functionality
                                  console.log('Reschedule appointment:', id);
                                }}
                                onCancel={(id) => {
                                  // TODO: Implement cancel functionality
                                  console.log('Cancel appointment:', id);
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Result
                            title="No Upcoming Appointments"
                            subTitle="You don't have any upcoming appointments. Book your first appointment to start your wellness journey!"
                            extra={
                              <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                onClick={() => router.push('/book/appointment')}
                              >
                                Book Your First Appointment
                              </Button>
                            }
                          />
                        )}
                      </div>
                    ),
                  }, {
                    label: 'Recent Activity',
                    key: 'recent',
                    children: (
                      <Card>
                        {activitiesLoading ? (
                          <div style={{ padding: '24px 0' }}>
                            <Skeleton active paragraph={{ rows: 4 }} />
                          </div>
                        ) : recentActivities.length > 0 ? (
                          <div style={{ padding: '12px 0' }}>
                            {recentActivities.map((activity, index) => (
                              <div key={activity.id || index} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: index < recentActivities.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                <Text strong>
                                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}: {activity.service}
                                </Text>
                                <br />
                                <Text type="secondary">
                                  {activity.therapist} • {activity.date.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Text>
                                {activity.rating && (
                                  <div style={{ marginTop: '4px' }}>
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} style={{ color: i < activity.rating ? '#faad14' : '#f0f0f0', fontSize: '14px' }}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '24px' }}>
                            <Text type="secondary">No recent activities found</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Your recent appointments and activities will appear here
                            </Text>
                          </div>
                        )}
                      </Card>
                    ),
                  }, {
                    label: 'Profile Overview',
                    key: 'profile',
                    children: (
                      <Card>

                        <Descriptions 
                          title="Personal Information" 
                          column={{ xs: 1, sm: 1, md: 2 }} 
                          bordered
                          size="middle"
                        >
                          <Descriptions.Item label="Full Name">
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
                              {customerProfile.gender.charAt(0).toUpperCase() + customerProfile.gender.slice(1)}
                            </Descriptions.Item>
                          )}
                          {(customerProfile.location?.city || customerProfile.location?.state || customerProfile.location?.country) && (
                            <Descriptions.Item label="Location">
                              {[customerProfile.location?.city, customerProfile.location?.state, customerProfile.location?.country]
                                .filter(Boolean)
                                .join(', ') || 'Not provided'}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                        
                        <Divider />
                        
                        <Descriptions 
                          title="Preferences & Wellness Information" 
                          column={{ xs: 1, sm: 1, md: 1 }} 
                          bordered
                          size="middle"
                        >
                          {customerProfile.wellnessGoals && (
                            <Descriptions.Item label="Wellness Goals">
                              {customerProfile.wellnessGoals}
                            </Descriptions.Item>
                          )}
                          
                          {customerProfile.stressLevel && (
                            <Descriptions.Item label="Current Stress Level">
                              <Tag 
                                color={
                                  customerProfile.stressLevel === 'low' ? 'green' :
                                  customerProfile.stressLevel === 'moderate' ? 'orange' :
                                  customerProfile.stressLevel === 'high' ? 'red' : 'volcano'
                                }
                              >
                                {customerProfile.stressLevel.charAt(0).toUpperCase() + customerProfile.stressLevel.slice(1)}
                              </Tag>
                            </Descriptions.Item>
                          )}
                          
                          {customerProfile.appointmentFrequency && (
                            <Descriptions.Item label="Preferred Appointment Frequency">
                              {customerProfile.appointmentFrequency.charAt(0).toUpperCase() + customerProfile.appointmentFrequency.slice(1).replace(/-/g, ' ')}
                            </Descriptions.Item>
                          )}
                          
                          {customerProfile.preferredTimeSlots && customerProfile.preferredTimeSlots.length > 0 && (
                            <Descriptions.Item label="Preferred Time Slots">
                              <Space>
                                {customerProfile.preferredTimeSlots.map((slot: string, index: number) => (
                                  <Tag key={index} color="blue">
                                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                  </Tag>
                                ))}
                              </Space>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                        
                        <Divider />
                        
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Card title="Service Preferences" size="small">
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
                            <Card title="Preferred Therapies" size="small">
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
                        
                        <Divider />
                        
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Card title="Lifestyle Factors" size="small">
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
                            <Card title="Medical Information Summary" size="small">
                              {customerProfile.medicalInfo?.notes ? (
                                <div>
                                  <Text strong>Notes:</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                    {customerProfile.medicalInfo.notes}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
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
                        
                        <Divider />
                        
                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                          <Button 
                            type="primary" 
                            onClick={() => openEditProfileModal()}
                          >
                            Edit Profile Information
                          </Button>
                        </div>
                      </Card>
                    ),
                  }]}
                />
                
                <Modal
                  title="Edit Profile Information"
                  open={isEditModalVisible}
                  onCancel={closeEditProfileModal}
                  onOk={handleEditProfileSubmit}
                  okText="Save Changes"
                  cancelText="Cancel"
                  width={800}
                  confirmLoading={isEditing}
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
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="zipCode"
                          label="ZIP Code"
                        >
                          <Input placeholder="Enter your ZIP code" />
                        </Form.Item>
                      </Col>
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
                    </Row>
                    
                    <Form.Item
                      name="wellnessGoals"
                      label="Wellness Goals"
                    >
                      <Input.TextArea 
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
                    </Row>
                    
                    <Form.Item
                      name="medicalNotes"
                      label="Medical Notes"
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="Any medical conditions, allergies, or health concerns we should be aware of" 
                      />
                    </Form.Item>
                  </Form>
                </Modal>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Card title="Wellness Goal Progress">
                  {customerProfile?.wellnessGoalsList && customerProfile.wellnessGoalsList.length > 0 ? (
                    <div style={{ padding: '12px 0' }}>
                      {customerProfile.wellnessGoalsList.slice(0, 3).map((goal: any, index: number) => (
                        <div key={goal._id || index} style={{ marginBottom: '16px' }}>
                          <Text strong>{goal.title}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {goal.description || 'No description provided'}
                          </Text>
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Progress
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {goal.progress || 0}%
                              </Text>
                            </div>
                            <div style={{ 
                              width: '100%', 
                              height: '6px', 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: '3px', 
                              overflow: 'hidden' 
                            }}>
                              <div style={{ 
                                width: `${goal.progress || 0}%`, 
                                height: '100%', 
                                backgroundColor: goal.progress >= 80 ? '#52c41a' : goal.progress >= 50 ? '#1890ff' : '#faad14',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                          {goal.targetDate && (
                            <Text type="secondary" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                              Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Text>
                          )}
                        </div>
                      ))}
                      {customerProfile.wellnessGoalsList.length > 3 && (
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => router.push('/dashboard/customer/goals')}
                          style={{ padding: 0 }}
                        >
                          View all goals
                        </Button>
                      )}
                    </div>
                  ) : customerProfile?.wellnessGoals ? (
                    <div style={{ padding: '12px 0' }}>
                      <Text strong>{customerProfile.wellnessGoals}</Text>
                      <br />
                      <Text type="secondary">General wellness goal</Text>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Overall Progress
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            0%
                          </Text>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '6px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '3px' 
                        }}>
                          <div style={{ 
                            width: '0%', 
                            height: '100%', 
                            backgroundColor: '#faad14' 
                          }} />
                        </div>
                      </div>
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => router.push('/dashboard/customer/goals')}
                        style={{ padding: 0, marginTop: '8px' }}
                      >
                        Set specific goals
                      </Button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <Text type="secondary">No wellness goals set yet</Text>
                      <br />
                      <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => router.push('/dashboard/customer/goals')}
                        style={{ marginTop: '12px' }}
                      >
                        Set Your Goals
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default CustomerDashboardPage;