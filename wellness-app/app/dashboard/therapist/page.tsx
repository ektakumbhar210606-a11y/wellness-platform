'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Layout, Menu, Button, Space, Typography, Row, Col, Statistic, Avatar, Tabs, message, Spin, Alert, Tag } from 'antd';
import { UserOutlined, CalendarOutlined, BookOutlined, MessageOutlined, ProfileOutlined, ShopOutlined } from '@ant-design/icons';
import TherapistProfileDisplay from '../../components/TherapistProfileDisplay';
import BusinessCard from '../../components/BusinessCard';
import TherapistBusinessRequests from '../../components/TherapistBusinessRequests';
import { useAuth } from '../../context/AuthContext';
import { therapistApi, makeAuthenticatedRequest } from '../../utils/apiUtils';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const TherapistDashboardPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const profileCheckRef = useRef(false); // Ref to prevent multiple API calls
  const [loading, setLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [therapistProfileExists, setTherapistProfileExists] = useState<boolean>(true);
  const [profileCheckComplete, setProfileCheckComplete] = useState<boolean>(false);
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false); // State to track redirect decision
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [therapistData, setTherapistData] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect to onboarding if therapist profile doesn't exist
  useEffect(() => {
    if (profileCheckComplete && !therapistProfileExists && shouldRedirect) {
      router.push('/onboarding/therapist');
    }
  }, [profileCheckComplete, therapistProfileExists, shouldRedirect, router]);

  // Fetch all businesses with therapist association status
  const fetchBusinesses = async () => {
    try {
      setBusinessesLoading(true);
      const response = await makeAuthenticatedRequest('/api/therapist/businesses');
      if (response.success && response.data) {
        setBusinesses(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      message.error('Failed to load businesses');
    } finally {
      setBusinessesLoading(false);
    }
  };

  // Handle join request
  const handleJoinRequest = async (businessId: string) => {
    // Prevent join request if therapist profile doesn't exist
    if (!therapistProfileExists) {
      message.warning('Complete your therapist profile to join businesses');
      return;
    }
    
    try {
      const response = await makeAuthenticatedRequest('/api/therapist/request-business', {
        method: 'POST',
        body: JSON.stringify({ businessId })
      });
      
      if (response.success) {
        message.success(response.message);
        // Refresh businesses list
        fetchBusinesses();
      }
    } catch (error: any) {
      console.error('Error requesting to join business:', error);
      message.error(error.message || 'Failed to send join request');
    }
  };

  // Check if therapist profile exists
  const checkTherapistProfile = async () => {
    // Prevent multiple API calls using ref
    if (profileCheckRef.current) {
      return; // Already checked, don't call again
    }
    
    profileCheckRef.current = true; // Mark as checked
    
    try {
      const response = await makeAuthenticatedRequest('/api/therapist/me');
      if (response.success && response.data) {
        setTherapistProfileExists(true);
        setTherapistData(response.data);
        // Dashboard data is now handled by the main useEffect in checkAccess
      } else {
        // Profile not found, set flag to redirect
        setShouldRedirect(true);
        setTherapistProfileExists(false);
      }
    } catch (error: any) {
      console.error('Error checking therapist profile:', error);
      // If the API returns 404 or contains 'not found' in the error message, profile doesn't exist
      // Otherwise, it might be an authentication issue, etc.
      if (error.status === 404 || error.message?.includes('not found')) {
        setShouldRedirect(true);
        setTherapistProfileExists(false);
      } else {
        // For other errors (like authentication errors), we should probably handle differently
        // For now, let's assume if there's an error other than 404, the profile exists but there's a fetch issue
        // Actually, if authentication fails, the user shouldn't be accessing this page anyway
        // So we should still redirect to onboarding
        setShouldRedirect(true);
        setTherapistProfileExists(false);
      }
    } finally {
      setProfileCheckComplete(true);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      console.log('User:', user);
      if (!user || user.role.toLowerCase() !== 'therapist') {
        console.log('User not authorized or not a therapist');
        router.push('/');
        return;
      }

      try {
        // Profile check will be handled by checkTherapistProfile function
        // Always fetch dashboard data when component mounts
        console.log('Attempting to fetch dashboard data...');
        const dashboardResponse = await therapistApi.getDashboardData();
        console.log('Dashboard API response:', dashboardResponse);
        if (dashboardResponse.success && dashboardResponse.data) {
          console.log('Successfully fetched dashboard data');
          setDashboardData(dashboardResponse.data);
        } else {
          console.error('Failed to fetch dashboard data - invalid response', dashboardResponse);
          // If dashboard data fetch fails, set to empty object to trigger error handling
          setDashboardData({});
        }
      } catch (error) {
        console.error('Error in initial check:', error);
        // Set dashboard data to empty object to trigger error handling
        setDashboardData({});
        router.push('/onboarding/therapist');
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    
    // Check therapist profile
    checkTherapistProfile();
  }, [user, router]);

  // Fetch businesses when businesses tab is activated
  useEffect(() => {
    if (activeTab === 'businesses' && businesses.length === 0) {
      fetchBusinesses();
    }
  }, [activeTab]);

  // Refetch dashboard data when profile tab is activated to ensure fresh data
  useEffect(() => {
    if (activeTab === 'profile' && therapistProfileExists) {
      const fetchFreshDashboardData = async () => {
        try {
          const dashboardResponse = await therapistApi.getDashboardData();
          if (dashboardResponse.success && dashboardResponse.data) {
            console.log('Received dashboard data:', dashboardResponse.data);
            console.log('Weekly availability in dashboard data:', dashboardResponse.data.profile?.weeklyAvailability);
            setDashboardData(dashboardResponse.data);
          }
        } catch (error) {
          console.error('Error fetching fresh dashboard data:', error);
        }
      };
      
      fetchFreshDashboardData();
    }
  }, [activeTab, therapistProfileExists]);

  // Effect to refresh data when the page becomes visible again (e.g., after returning from profile edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && therapistProfileExists) {
        // Page became visible again, refresh dashboard data
        const refreshDashboardData = async () => {
          try {
            const dashboardResponse = await therapistApi.getDashboardData();
            if (dashboardResponse.success && dashboardResponse.data) {
              console.log('Successfully refreshed dashboard data');
              setDashboardData(dashboardResponse.data);
            } else {
              console.error('Failed to refresh dashboard data - invalid response', dashboardResponse);
            }
          } catch (error) {
            console.error('Error refreshing dashboard data:', error);
          }
        };
        
        refreshDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [therapistProfileExists]);

  // Auto-refresh businesses list periodically to show updated request status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (activeTab === 'businesses') {
      // Refresh every 15 seconds when on businesses tab to show real-time status updates
      intervalId = setInterval(() => {
        fetchBusinesses();
      }, 15000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab]);

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

  if (profileCheckComplete && !therapistProfileExists) {
    return null; // Don't render anything after redirect effect
  }

  if (!dashboardData) {
    // If we reach here without dashboard data, it means the profile exists
    // but dashboard data couldn't be fetched - we should still render the dashboard
    // but with minimal content
    console.warn('Dashboard data not available, but therapist profile exists');
    // Render a minimal dashboard with basic information
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header" style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ float: 'left', padding: '0 24px', fontSize: '20px', fontWeight: 'bold', lineHeight: '64px' }}>
            Dashboard
          </div>
          <div style={{ float: 'right', padding: '0 24px', lineHeight: '64px' }}>
            <Space>
              <Text strong>{user?.name || therapistData?.fullName || ''}</Text>
              <Avatar icon={<UserOutlined />} />
            </Space>
          </div>
        </Header>
        <Layout style={{ padding: '24px' }}>
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
                  <Title level={2}>Welcome Back, {user?.name || ''}!</Title>
                  <Text type="secondary">We're loading your dashboard information...</Text>
                </Col>
              </Row>
              <Alert
                title="Information"
                description="Dashboard data is temporarily unavailable. Please try again later."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ float: 'left', padding: '0 24px', fontSize: '20px', fontWeight: 'bold', lineHeight: '64px' }}>
          Dashboard
        </div>
        <div style={{ float: 'right', padding: '0 24px', lineHeight: '64px' }}>
          <Space>
            <Text strong>{user?.name || therapistData?.fullName || ''}</Text>
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
                <Title level={2}>Welcome Back, {therapistData?.fullName || user?.name || ''}!</Title>
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
                      <Col span={24}>
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
                              <p>No recent activity yet.</p>
                            </div>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </>
                ),
              }, {
                key: 'businesses',
                label: (
                  <span>
                    <ShopOutlined />
                    Businesses
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 16 }}>
                    <Tabs 
                      defaultActiveKey="available"
                      items={[{
                        key: 'available',
                        label: 'Available Businesses',
                        children: (
                          <>
                            {profileCheckComplete && !therapistProfileExists && (
                              <div style={{ marginBottom: 16 }}>
                                <Alert
                                  message="Complete your therapist profile to join businesses"
                                  type="warning"
                                  showIcon
                                  action={
                                    <Button size="small" onClick={() => router.push('/onboarding/therapist')}>
                                      Complete Profile
                                    </Button>
                                  }
                                />
                              </div>
                            )}
                            <Row gutter={[16, 16]}>
                              <Col span={24}>
                                <Title level={3}>Available Businesses</Title>
                                <Text type="secondary">
                                  {businesses.length > 0 ? 
                                    'Request to join businesses to expand your practice opportunities' : 
                                    'No businesses available to join at this time'
                                  }
                                </Text>
                              </Col>
                              
                              <Col span={24}>
                                {businessesLoading ? (
                                  <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <Spin size="large" />
                                    <div style={{ marginTop: 16 }}>
                                      <Text>Loading businesses...</Text>
                                    </div>
                                  </div>
                                ) : businesses.length > 0 ? (
                                  <Row gutter={[16, 16]}>
                                    {businesses.map((business) => (
                                      <Col xs={24} sm={12} md={8} lg={6} key={business._id}>
                                        <div style={{ height: '100%' }}>
                                          <BusinessCard 
                                            business={business}
                                            onJoinRequest={handleJoinRequest}
                                            disabled={!therapistProfileExists}
                                          />
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                ) : (
                                  <Card>
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                      <ShopOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                                      <Title level={4}>No Businesses Available</Title>
                                      <Text type="secondary">
                                        {therapistProfileExists ? 
                                          'No businesses are currently available for joining.' : 
                                          'Complete your profile to view and join businesses.'
                                        }
                                      </Text>
                                    </div>
                                  </Card>
                                )}
                              </Col>
                            </Row>
                          </>
                        )
                      }, {
                        key: 'requests',
                        label: 'My Requests',
                        children: <TherapistBusinessRequests />
                      }]}
                    />
                  </div>
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