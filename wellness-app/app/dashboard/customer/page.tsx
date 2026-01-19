'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Layout, Menu, Button, Space, Typography, Row, Col, Statistic, Avatar, Tabs } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  BookOutlined, 
  HeartOutlined, 
  ShoppingCartOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;


const CustomerDashboardPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

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
      //   setCustomerProfile(response.data);
      // } else {
      //   // If profile doesn't exist, redirect to onboarding
      //   router.push('/onboarding/customer');
      // }
      
      // Simulate profile data
      setCustomerProfile({
        fullName: user.name || 'Customer',
        preferences: ['massage', 'spa'],
        wellnessGoals: 'Reduce stress and improve flexibility'
      });

      setLoading(false);
    };

    checkAccess();
  }, [user, router]);

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
                  <Statistic
                    title="Appointments"
                    value={3}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Favorite Therapists"
                    value={2}
                    prefix={<HeartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Services Used"
                    value={5}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Avg. Rating"
                    value={4.7}
                    precision={1}
                    prefix={<StarOutlined />}
                    suffix="/ 5"
                  />
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
                      <>
                        <Card style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text strong>Swedish Massage</Text>
                              <br />
                              <Text type="secondary">with Sarah Johnson</Text>
                              <br />
                              <Text type="secondary">Jan 20, 2026 at 2:00 PM</Text>
                            </div>
                            <Button type="primary">Reschedule</Button>
                          </div>
                        </Card>
                        <Card>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text strong>Deep Tissue Session</Text>
                              <br />
                              <Text type="secondary">with Michael Chen</Text>
                              <br />
                              <Text type="secondary">Jan 25, 2026 at 10:00 AM</Text>
                            </div>
                            <Button>Cancel</Button>
                          </div>
                        </Card>
                      </>
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
                      onClick={() => router.push('/book/appointment')}
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