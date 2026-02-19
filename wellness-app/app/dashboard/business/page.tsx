'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Button, Space } from 'antd';
import { DollarOutlined, BookOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BusinessDashboardPage = () => {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', width: '100%' }}>
      <Title level={2}>Business Dashboard</Title>
      <Text type="secondary">Welcome to your business management center</Text>
      
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
    </div>
  );
};

export default BusinessDashboardPage;