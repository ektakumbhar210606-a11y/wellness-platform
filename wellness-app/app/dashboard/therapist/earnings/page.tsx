'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Space, Spin, message } from 'antd';
import { DollarOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';
import { formatCurrency } from '@/utils/currencyFormatter';

const { Title, Text } = Typography;

interface EarningRecord {
  id: string;
  displayId?: string;
  service: {
    id: string;
    name: string;
    price: number;
  };
  customer?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  date: string;
  bookingDate?: string;
  therapistPayoutAmount: number;
  therapistPaidAt?: string;
  paymentStatus?: string;
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
      title: 'Booking ID',
      dataIndex: 'displayId',
      key: 'bookingId',
      render: (displayId: string) => (
        <div>
          <Tag color="blue" style={{ fontSize: '12px', padding: '2px 8px' }}>
            {displayId ? `BK-${displayId.toUpperCase()}` : 'N/A'}
          </Tag>
        </div>
      ),
    },
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
      render: (_: any, record: EarningRecord) => {
        const fullName = record.customer ? [record.customer.firstName, record.customer.lastName].filter(Boolean).join(' ') : 'N/A';
        return (
          <div>
            <div><UserOutlined /> {fullName || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      title: 'Booking Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (bookingDate: string) => (
        <div>
          <div><CalendarOutlined /> {bookingDate ? new Date(bookingDate).toLocaleDateString() : 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Service Date',
      dataIndex: 'date',
      key: 'serviceDate',
      render: (date: string) => (
        <div>
          <div><CalendarOutlined /> {date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
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
      title: 'Payout Amount',
      dataIndex: 'therapistPayoutAmount',
      key: 'payoutAmount',
      render: (amount: number) => (
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
          <DollarOutlined /> {formatCurrency(amount, 'INR')}
        </div>
      ),
    },
    {
      title: 'Payment Date to Therapist',
      dataIndex: 'therapistPaidAt',
      key: 'paidDate',
      render: (paidAt: string) => (
        <div>
          {paidAt ? new Date(paidAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        let color = 'default';
        if (status?.toLowerCase() === 'paid') {
          color = 'green';
        } else if (status?.toLowerCase() === 'pending') {
          color = 'orange';
        }
        return (
          <Tag color={color}>
            {status || 'Pending'}
          </Tag>
        );
      },
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
        Track your paid earnings from completed sessions with user-friendly booking references
      </Text>

      <Card style={{ marginTop: 24 }}>
        {earnings.length > 0 ? (
          <Table
            dataSource={earnings}
            columns={columns}
            rowKey={(record, index) => record.id || record.displayId || `earning-${index}`}
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