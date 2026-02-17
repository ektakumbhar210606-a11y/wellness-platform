'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  List, 
  Avatar, 
  Typography, 
  Button, 
  Spin, 
  Empty,
  Space,
  Tag,
  Menu
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  StarOutlined, 
  ClockCircleOutlined,
  RightOutlined,
  SearchOutlined,
  ProfileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import CustomerUpcomingAppointmentCard from '@/app/components/CustomerUpcomingAppointmentCard';
import Link from 'next/link';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface DashboardStats {
  appointments: number;
  upcomingAppointments: number;
  servicesUsed: number;
  avgRating: number;
}

interface UpcomingBooking {
  id: string;
  service: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: number;
  } | null;
  business: {
    id: string;
    name: string;
    address?: string;
    currency?: string;
  } | null;
  therapist: {
    id: string;
    fullName: string;
    professionalTitle?: string;
  } | null;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

const CustomerDashboardContent = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/customer/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch upcoming appointments
  useEffect(() => {
    const fetchUpcomingBookings = async () => {
      try {
        setBookingsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/customer/bookings/upcoming?page=1&limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.bookings) {
            setUpcomingBookings(data.data.bookings);
          }
        }
      } catch (error) {
        console.error('Error fetching upcoming bookings:', error);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchUpcomingBookings();
  }, []);

  // Set loading state
  useEffect(() => {
    if (!statsLoading && !bookingsLoading) {
      setLoading(false);
    }
  }, [statsLoading, bookingsLoading]);

  // Sidebar menu items
  const menuItems = [
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: <Link href="/search">Find Services</Link>,
    },
    {
      key: 'bookings',
      icon: <BookOutlined />,
      label: <Link href="/dashboard/customer/bookings">My Bookings</Link>,
    },
    {
      key: 'profile',
      icon: <EditOutlined />,
      label: <Link href="/dashboard/customer/profile">Profile</Link>,
    },
  ];

  const StatCard = ({ title, value, icon, color }: { 
    title: string; 
    value: React.ReactNode; 
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <Space align="start">
        <div style={{ 
          backgroundColor: color, 
          borderRadius: '50%', 
          width: 48, 
          height: 48, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </div>
        <div>
          <Text type="secondary">{title}</Text>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
            {value}
          </div>
        </div>
      </Space>
    </Card>
  );

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading your dashboard...</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 20px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center',
          height: '100%',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={3} style={{ 
                margin: 0, 
                fontSize: '20px',
                lineHeight: '1.3',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Welcome back, {user?.name || 'Customer'}!
              </Title>
              <Text type="secondary" style={{
                fontSize: '14px',
                lineHeight: '1.4',
                marginTop: '4px',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Here's what's happening with your wellness journey
              </Text>
            </div>
          </div>
        </div>
      </Header>

      <Layout>
        {/* Sidebar */}
        <Sider 
          collapsible
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          width={250}
          style={{
            background: '#fff',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            overflow: 'auto',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ padding: '16px' }}>
            <Menu
              mode="inline"
              items={menuItems}
              style={{ border: 'none' }}
            />
          </div>
        </Sider>

        {/* Main Content */}
        <Content style={{ padding: '24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Stats Overview */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Total Appointments" 
                value={stats?.appointments || 0}
                icon={<CalendarOutlined style={{ fontSize: '24px', color: 'white' }} />}
                color="#667eea"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Upcoming" 
                value={stats?.upcomingAppointments || 0}
                icon={<ClockCircleOutlined style={{ fontSize: '24px', color: 'white' }} />}
                color="#f093fb"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Services Used" 
                value={stats?.servicesUsed || 0}
                icon={<ProfileOutlined style={{ fontSize: '24px', color: 'white' }} />}
                color="#43e97b"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Avg Rating" 
                value={
                  <Space>
                    <span>{stats?.avgRating?.toFixed(1) || '0.0'}</span>
                    <StarOutlined style={{ color: '#faad14' }} />
                  </Space>
                }
                icon={<StarOutlined style={{ fontSize: '24px', color: 'white' }} />}
                color="#fa8bfd"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Upcoming Appointments */}
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <CalendarOutlined />
                    <span>Upcoming Appointments</span>
                  </Space>
                }
                extra={
                  <Link href="/dashboard/customer/bookings">
                    <Button type="link" icon={<RightOutlined />}>
                      View All
                    </Button>
                  </Link>
                }
              >
                {bookingsLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px' }}>
                    <Spin />
                  </div>
                ) : upcomingBookings.length > 0 ? (
                  <div>
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} style={{ marginBottom: '12px' }}>
                        <CustomerUpcomingAppointmentCard
                          appointment={{
                            id: booking.id,
                            service: booking.service ? {
                              id: booking.service.id,
                              name: booking.service.name,
                              price: booking.service.price || 0,
                              duration: booking.service.duration || 60,
                              description: booking.service.description || ''
                            } : null,
                            therapist: booking.therapist ? {
                              id: booking.therapist.id,
                              fullName: booking.therapist.fullName,
                              professionalTitle: booking.therapist.professionalTitle || ''
                            } : null,
                            business: booking.business ? {
                              id: booking.business.id,
                              name: booking.business.name,
                              address: booking.business.address ? {
                                country: booking.business.address
                              } : undefined,
                              currency: booking.business.currency
                            } : null,
                            date: new Date(booking.date),
                            time: booking.time,
                            status: booking.status,
                            createdAt: new Date(booking.createdAt),
                            updatedAt: new Date(booking.createdAt)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    description="No upcoming appointments"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Link href="/search">
                      <Button type="primary" icon={<SearchOutlined />}>
                        Book Your First Appointment
                      </Button>
                    </Link>
                  </Empty>
                )}
              </Card>
            </Col>

          </Row>
        </div>
      </Content>
    </Layout>
  </Layout>
);
};

export default CustomerDashboardContent;