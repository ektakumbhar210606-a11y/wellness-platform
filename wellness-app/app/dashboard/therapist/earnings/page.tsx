'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Space, Spin, message } from 'antd';
import { DollarOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';
import { formatCurrency } from '@/utils/currencyFormatter';

const { Title, Text } = Typography;

interface EarningRecord {
  id: string;
  service: {
    id: string;
    name: string;
    price: number;
  };
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  date: string;
  therapistPayoutAmount: number;
  therapistPaidAt: string;
  displayId?: string;
}

const TherapistEarningsPage = () => {
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/therapist/earnings');

      if (response.success && response.data) {
        setEarnings(response.data);
      } else {
        message.error(response.error || 'Failed to fetch earnings');
        setEarnings([]);
      }
    } catch (error: any) {
      console.error('Error fetching earnings:', error);
      message.error('Failed to fetch earnings');
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (serviceName: string) => (
        <div>
          <div><DollarOutlined /> {serviceName}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: EarningRecord) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName} {record.customer.lastName}</div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <div>
          <div><CalendarOutlined /> {new Date(date).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      title: 'Service Price',
      dataIndex: ['service', 'price'],
      key: 'servicePrice',
      render: (price: number) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
          <DollarOutlined /> {formatCurrency(price, 'INR')}
        </div>
      ),
    },
    {
      title: 'Payout Amount (40%)',
      dataIndex: 'therapistPayoutAmount',
      key: 'payoutAmount',
      render: (amount: number) => (
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
          <DollarOutlined /> {formatCurrency(amount, 'INR')}
        </div>
      ),
    },
    {
      title: 'Paid Date',
      dataIndex: 'therapistPaidAt',
      key: 'paidDate',
      render: (paidAt: string) => (
        <div>
          {new Date(paidAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
        <div style={{ marginLeft: 16 }}>
          <Text>Loading earnings...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>My Earnings</Title>
      <Text type="secondary">
        Track your paid earnings from completed sessions
      </Text>

      <Card style={{ marginTop: 24 }}>
        {earnings.length > 0 ? (
          <Table
            dataSource={earnings}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} earnings`
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <DollarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <Title level={4}>No Earnings Yet</Title>
            <Text type="secondary">
              Your paid earnings will appear here once you've completed sessions and received payment.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TherapistEarningsPage;