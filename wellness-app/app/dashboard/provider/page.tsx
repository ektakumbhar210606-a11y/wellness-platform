'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Spin, message } from 'antd';
import { UserOutlined, CalendarOutlined, StarOutlined, DollarOutlined, ShopOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { businessService, BusinessProfile } from '@/app/services/businessService';

const { Title, Text } = Typography;

const ProviderDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      if (user.role.toLowerCase() === 'customer') {
        router.push('/dashboard/customer');
      } else if (user.role.toLowerCase() === 'therapist') {
        router.push('/dashboard/therapist');
      } else {
        router.push('/');
      }
      return;
    }
    
    // Fetch business profile to determine if onboarding is complete
    const fetchBusinessProfile = async () => {
      try {
        const profile = await businessService.getBusinessProfile();
        setBusiness(profile);
      } catch (error: any) {
        console.error('Error fetching business profile:', error);
        message.error(error.message || 'Failed to fetch business profile');
        // If profile doesn't exist, redirect to onboarding
        if (error.status === 404) {
          router.push('/onboarding/provider');
        }
        return; // Exit early if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <Title level={2}>Provider Dashboard</Title>
        <Text>Welcome back! Here's what's happening with your business today.</Text>
      </div>
      
      {business && (
        <div style={{ marginBottom: '30px' }}>
          <Card title="Business Profile" style={{ marginBottom: '20px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <ShopOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>{business.business_name}</Text>
                    <br />
                    <Text type="secondary">{business.description}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                  <Text>{business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={24}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Upcoming Appointments"
              value={5}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg. Rating"
              value={4.8}
              precision={1}
              prefix={<StarOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={2450}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Recent Bookings" style={{ height: '300px' }}>
            <Text>No recent bookings. Keep promoting your services!</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Quick Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button type="primary" onClick={() => router.push('/dashboard/provider/calendar')}>View Calendar</Button>
              <Button onClick={() => router.push('/dashboard/provider/services')}>Manage Services</Button>
              <Button onClick={() => router.push('/dashboard/provider/profile')}>Update Profile</Button>
              <Button onClick={() => router.push('/dashboard/provider/earnings')}>View Earnings</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProviderDashboard;