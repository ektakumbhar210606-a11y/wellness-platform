'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Layout, Menu, Button, Space, Typography, Row, Col, Statistic, Avatar, Tabs, Skeleton, Result, Alert } from 'antd';
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


  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      // Simulate profile data
      setCustomerProfile({
        fullName: user.name || 'Customer',
        preferences: ['massage', 'spa'],
        wellnessGoals: 'Reduce stress and improve flexibility'
      });

      // Fetch dashboard statistics
      fetchDashboardStats();
          
      // Fetch upcoming appointments
      fetchUpcomingAppointments();

      setLoading(false);
    };

    checkAccess();
  }, [user, router]);

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
      label: 'My Profile',
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
                <Title level={2}>Welcome Back, {customerProfile.fullName || 'Customer'}!</Title>
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
              <Col xs={24} md={16}>
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
                        <div style={{ padding: '12px 0' }}>
                          <p>Completed: Relaxing Spa Day (Jan 10, 2026)</p>
                          <p>Reviewed: Aromatherapy Session (Jan 8, 2026)</p>
                          <p>Booked: Hot Stone Therapy (Jan 20, 2026)</p>
                          <p>Visited: Wellness Consultation (Jan 5, 2026)</p>
                        </div>
                      </Card>
                    ),
                  }]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Card title="Quick Actions">
                  <Space vertical style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      block
                      disabled={loading}
                      onClick={() => router.push('/dashboard/customer/services')}
                    >
                      Book New Appointment
                    </Button>
                    <Button 
                      block
                      onClick={() => router.push('/dashboard/customer/favorites')}
                    >
                      View Favorite Therapists
                    </Button>
                    <Button 
                      block
                      onClick={() => router.push('/dashboard/customer/history')}
                    >
                      View Wellness History
                    </Button>
                    <Button 
                      block
                      onClick={() => router.push('/dashboard/customer/preferences')}
                    >
                      Update Preferences
                    </Button>
                  </Space>
                </Card>

                <Card title="Wellness Goal Progress" style={{ marginTop: 16 }}>
                  <div style={{ padding: '12px 0' }}>
                    <Text strong>Reduce stress and improve flexibility</Text>
                    <br />
                    <Text type="secondary">Progress: 65%</Text>
                  </div>
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