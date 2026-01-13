'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Table, DatePicker, Select, Button, Space } from 'antd';
import { DollarOutlined, UserOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ProviderEarningsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[RangePickerProps['value'], RangePickerProps['value']]>([null, null]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      router.push('/dashboard');
      return;
    }

    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [isAuthenticated, user, router]);

  // Mock data for earnings
  const earningsData = [
    { id: 1, date: '2023-12-15', service: 'Deep Tissue Massage', client: 'John Smith', amount: 80, status: 'Completed' },
    { id: 2, date: '2023-12-16', service: 'Aromatherapy', client: 'Sarah Johnson', amount: 70, status: 'Completed' },
    { id: 3, date: '2023-12-17', service: 'Hot Stone Therapy', client: 'Michael Brown', amount: 95, status: 'Completed' },
    { id: 4, date: '2023-12-18', service: 'Deep Tissue Massage', client: 'Emily Davis', amount: 80, status: 'Completed' },
    { id: 5, date: '2023-12-19', service: 'Aromatherapy', client: 'David Wilson', amount: 70, status: 'Completed' },
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
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: 'Amount ($)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  // Calculate summary statistics
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);
  const totalAppointments = earningsData.length;
  const avgEarnings = totalEarnings / (totalAppointments || 1);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <DollarOutlined /> Business Earnings
        </Title>
        <Text>View your earnings, payments, and financial performance</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Earnings"
              value={totalEarnings}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Appointments"
              value={totalAppointments}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg. per Appointment"
              value={Math.round(avgEarnings)}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={98}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Earnings Overview" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <Space>
            <Text>Filter by date:</Text>
            <RangePicker onChange={(dates) => setDateRange(dates as [RangePickerProps['value'], RangePickerProps['value']])} />
          </Space>
          <Space>
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">All Services</Option>
              <Option value="massage">Massage</Option>
              <Option value="therapy">Therapy</Option>
              <Option value="skincare">Skincare</Option>
            </Select>
            <Button type="primary">Export Report</Button>
          </Space>
        </div>
      </Card>

      <Card title="Earnings Details">
        <Table 
          dataSource={earningsData} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => router.back()}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default ProviderEarningsPage;