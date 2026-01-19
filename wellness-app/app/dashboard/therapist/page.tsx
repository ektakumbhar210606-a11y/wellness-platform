'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Layout, Menu, Button, Space, Typography, Row, Col, Statistic, Avatar, Tabs } from 'antd';
import { UserOutlined, CalendarOutlined, BookOutlined, MessageOutlined, ProfileOutlined } from '@ant-design/icons';
import TherapistProfileDisplay from '../../components/TherapistProfileDisplay';
import { useAuth } from '../../context/AuthContext';
import { therapistApi } from '../../utils/apiUtils';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const TherapistDashboardPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'therapist') {
        router.push('/');
        return;
      }

      try {
        const response = await therapistApi.getDashboardData();
        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          // If profile doesn't exist, redirect to onboarding
          router.push('/onboarding/therapist');
        }
      } catch (error) {
        console.error('Error fetching therapist dashboard data:', error);
        // If profile doesn't exist, redirect to onboarding
        router.push('/onboarding/therapist');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, router]);

  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    {
      key: '1',
      label: 'Dashboard',
      icon: <UserOutlined />,
      onClick: () => {
        router.push('/dashboard/therapist');
        setActiveTab('dashboard');
      },
    },
    {
      key: '2',
      label: 'Profile',
      icon: <ProfileOutlined />,
      onClick: () => {
        setActiveTab('profile');
      },
    },
    {
      key: '3',
      label: 'Schedule',
      icon: <CalendarOutlined />,
      onClick: () => console.log('Navigate to schedule'),
    },
    {
      key: '4',
      label: 'Bookings',
      icon: <BookOutlined />,
      onClick: () => console.log('Navigate to bookings'),
    },
    {
      key: '5',
      label: 'Reviews',
      icon: <MessageOutlined />,
      onClick: () => console.log('Navigate to reviews'),
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

  if (!dashboardData) {
    return null; // Already redirected in useEffect
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ float: 'left', padding: '0 24px', fontSize: '20px', fontWeight: 'bold', lineHeight: '64px' }}>
          Therapist Dashboard
        </div>
        <div style={{ float: 'right', padding: '0 24px', lineHeight: '64px' }}>
          <Space>
            <Text strong>{user?.name || dashboardData.profile?.fullName || 'Therapist'}</Text>
            <Avatar icon={<UserOutlined />} />
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff', padding: '24px 0' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            selectedKeys={[activeTab === 'profile' ? '2' : '1']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280, borderRadius: 8 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={2}>Welcome Back, {dashboardData.profile?.fullName || 'Therapist'}!</Title>
                <Text type="secondary">Here's what's happening with your practice today.</Text>
              </Col>
            </Row>

            <Tabs 
              activeKey={activeTab}
              defaultActiveKey="dashboard"
              size="large"
              centered
              onChange={(key) => setActiveTab(key)}
              items={[{
                key: 'dashboard',
                label: 'Dashboard Overview',
                children: (
                  <>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Today's Appointments"
                            value={dashboardData.stats?.todaysAppointments || 0}
                            prefix={<CalendarOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Pending Requests"
                            value={dashboardData.stats?.pendingRequests || 0}
                            prefix={<BookOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Completed Sessions"
                            value={dashboardData.stats?.completedSessions || 0}
                            prefix={<UserOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Avg. Rating"
                            value={dashboardData.stats?.avgRating || 0}
                            precision={1}
                            prefix={<MessageOutlined />}
                            suffix="/ 5"
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                      <Col xs={24} md={16}>
                        <Card title="Recent Activity" style={{ height: '100%' }}>
                          {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {dashboardData.recentActivity.map((activity: any, index: number) => (
                                <div key={index} style={{ padding: '12px 0', borderBottom: index !== dashboardData.recentActivity.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                  <div><strong>{activity.service?.name || 'Service'}</strong> with <strong>{activity.customer?.name || 'Customer'}</strong></div>
                                  <div style={{ fontSize: '12px', color: '#888' }}>{new Date(activity.date).toLocaleDateString()} at {activity.time} • Status: {activity.status}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ padding: '12px 0' }}>
                              <p>No recent activity yet. Your upcoming appointments will appear here.</p>
                            </div>
                          )}
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card title="Quick Actions">
                          <Space vertical style={{ width: '100%' }}>
                            <Button 
                              type="primary" 
                              block
                              onClick={() => router.push('/dashboard/therapist/profile')}
                            >
                              Edit Profile
                            </Button>
                            <Button block>View Schedule</Button>
                            <Button block>Manage Availability</Button>
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                  </>
                ),
              }, {
                key: 'profile',
                label: 'Profile Information',
                children: (
                  <div style={{ marginTop: 16 }}>
                    <TherapistProfileDisplay profile={dashboardData.profile} />
                  </div>
                ),
              }]}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default TherapistDashboardPage;