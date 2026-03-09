'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Button, Space, Tabs } from 'antd';
import {
  DollarOutlined,
  BookOutlined,
  StarOutlined,
  TrophyOutlined,
  StopOutlined
} from '@ant-design/icons';
import BusinessReviews from '../../components/BusinessReviews';
import TherapistBonuses from '../../components/business/TherapistBonuses';
import TherapistCancelRequests from '../../components/business/TherapistCancelRequests';

const { Title, Text } = Typography;

const BusinessDashboardPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      key: 'overview',
      label: 'Dashboard Overview',
      children: (
        <div style={{ marginTop: '30px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card 
              title={
                <Space>
                  <DollarOutlined />
                  Earnings Management
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  onClick={() => router.push('/dashboard/business/earning')}
                >
                  View Earnings
                </Button>
              }
            >
              <Text>Track your business earnings from half and full payments</Text>
            </Card>
            
            <Card 
              title={
                <Space>
                  <BookOutlined />
                  Booking Management
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  onClick={() => router.push('/dashboard/provider?tab=bookings')}
                >
                  Manage Bookings
                </Button>
              }
            >
              <Text>Manage your booking requests and confirmed appointments</Text>
            </Card>
          </Space>
        </div>
      ),
    },
    {
      key: 'bonuses',
      label: (
        <span>
          <TrophyOutlined />
          Therapist Bonuses
        </span>
      ),
      children: (
        <div style={{ marginTop: '24px' }}>
          <TherapistBonuses />
        </div>
      ),
    },
    {
      key: 'reviews',
      label: (
        <span>
          <StarOutlined />
          Reviews
        </span>
      ),
      children: (
        <div style={{ marginTop: '24px' }}>
          <BusinessReviews />
        </div>
      ),
    },
    {
      key: 'cancel-requests',
      label: (
        <span>
          <StopOutlined style={{ color: '#d32f2f' }} />
          Cancel Requests
        </span>
      ),
      children: (
        <div style={{ marginTop: '24px' }}>
          <TherapistCancelRequests />
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', width: '100%' }}>
      <Title level={2}>Business Dashboard</Title>
      <Text type="secondary">Welcome to your business management center</Text>
      
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};

export default BusinessDashboardPage;