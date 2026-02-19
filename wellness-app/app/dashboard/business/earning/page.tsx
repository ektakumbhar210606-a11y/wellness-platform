'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Table, Tag } from 'antd';
import { DollarOutlined, PercentageOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext'; // Adjust path as needed
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const BusinessEarningsPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is business/provider, otherwise redirect
  if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
    if (user.role.toLowerCase() === 'customer') {
      router.push('/dashboard/customer');
    } else if (user.role.toLowerCase() === 'therapist') {
      router.push('/dashboard/therapist');
    } else {
      router.push('/');
    }
    return null;
  }

  // Mock data for earnings
  const earningsData = {
    totalEarnings: 24567.89,
    monthlyEarnings: 4567.23,
    pendingPayouts: 1200.50,
    bookingCount: 127,
  };

  const earningsHistory = [
    { id: 1, date: '2023-06-15', service: 'Deep Tissue Massage', amount: 85.00, status: 'paid' },
    { id: 2, date: '2023-06-14', service: 'Hot Stone Therapy', amount: 120.00, status: 'paid' },
    { id: 3, date: '2023-06-12', service: 'Facial Treatment', amount: 95.00, status: 'pending' },
    { id: 4, date: '2023-06-10', service: 'Aromatherapy Session', amount: 110.00, status: 'paid' },
    { id: 5, date: '2023-06-08', service: 'Body Scrub', amount: 75.00, status: 'paid' },
  ];

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: number) => `$${text.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Earnings"
                value={earningsData.totalEarnings}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Monthly Earnings"
                value={earningsData.monthlyEarnings}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Payouts"
                value={earningsData.pendingPayouts}
                precision={2}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<PercentageOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Bookings"
                value={earningsData.bookingCount}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Earnings History" style={{ height: '300px' }}>
              <Table 
                dataSource={earningsHistory} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ y: 200 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '30px' }}>
          <Col span={12}>
            <Card title="Payment Methods">
              <Text strong>Bank Account</Text>
              <br />
              <Text type="secondary">**** **** **** 1234</Text>
              <br /><br />
              <Text type="success">Verified & Active</Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Next Payout">
              <Text>June 30, 2023</Text>
              <br />
              <Text type="success">$1,200.50</Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default BusinessEarningsPage;