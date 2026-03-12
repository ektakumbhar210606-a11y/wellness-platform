'use client';

import { useEffect, useState } from 'react';
import { Table, Card, Tag, Typography, Spin, Alert, Empty, Space, Button } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface TherapistStat {
  therapistName: string;
  completedBookings: number;
  monthlyCancelCount: number;
  totalCancelCount: number;
  cancelWarnings: number;
  bonusPenaltyPercentage: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: TherapistStat[];
  error?: string;
}

const TherapistCancellationPerformance = () => {
  const [stats, setStats] = useState<TherapistStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCancellationStats();
  }, []);

  const fetchCancellationStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/business/therapist-cancellation-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch cancellation statistics');
      }

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Error fetching cancellation stats:', err);
      setError(err.message || 'Failed to load cancellation statistics');
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Determine penalty level for color coding
  const getPenaltyColor = (percentage: number): string => {
    if (percentage === 0) return '#52c41a'; // Green
    if (percentage <= 10) return '#faad14'; // Orange/Yellow
    if (percentage <= 25) return '#ff7a45'; // Orange
    return '#d32f2f'; // Red
  };

  // Determine warning status
  const getWarningStatus = (hasWarning: boolean, monthlyCount: number) => {
    if (!hasWarning && monthlyCount < 3) {
      return {
        text: 'No',
        color: 'success',
        icon: <CheckCircleOutlined />
      };
    }
    return {
      text: 'Yes',
      color: 'warning',
      icon: <WarningOutlined />
    };
  };

  const columns: ColumnsType<TherapistStat> = [
    {
      title: 'Therapist Name',
      dataIndex: 'therapistName',
      key: 'therapistName',
      sorter: (a, b) => a.therapistName.localeCompare(b.therapistName),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Completed Bookings',
      dataIndex: 'completedBookings',
      key: 'completedBookings',
      align: 'center',
      sorter: (a, b) => a.completedBookings - b.completedBookings,
      render: (value: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>{value}</Text>
      ),
    },
    {
      title: 'Monthly Cancel',
      dataIndex: 'monthlyCancelCount',
      key: 'monthlyCancelCount',
      align: 'center',
      sorter: (a, b) => a.monthlyCancelCount - b.monthlyCancelCount,
      render: (value: number) => {
        let color = '#52c41a'; // Green
        if (value >= 3) color = '#faad14'; // Yellow/Orange
        if (value >= 5) color = '#ff7a45'; // Orange
        if (value >= 7) color = '#d32f2f'; // Red
        
        return (
          <Text strong style={{ color }}>
            {value}
          </Text>
        );
      },
    },
    {
      title: 'Total Cancel',
      dataIndex: 'totalCancelCount',
      key: 'totalCancelCount',
      align: 'center',
      sorter: (a, b) => a.totalCancelCount - b.totalCancelCount,
      render: (value: number) => <Text>{value}</Text>,
    },
    {
      title: 'Warning',
      dataIndex: 'cancelWarnings',
      key: 'cancelWarnings',
      align: 'center',
      filters: [
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value, record) => (value === true ? record.cancelWarnings > 0 : record.cancelWarnings === 0),
      render: (value: number, record: TherapistStat) => {
        const status = getWarningStatus(value > 0, record.monthlyCancelCount);
        return (
          <Tag color={status.color} icon={status.icon}>
            {status.text}
          </Tag>
        );
      },
    },
    {
      title: 'Bonus Penalty',
      dataIndex: 'bonusPenaltyPercentage',
      key: 'bonusPenaltyPercentage',
      align: 'center',
      sorter: (a, b) => a.bonusPenaltyPercentage - b.bonusPenaltyPercentage,
      render: (value: number) => {
        const color = getPenaltyColor(value);
        return (
          <Text strong style={{ color, fontSize: '16px' }}>
            {value}%
          </Text>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card variant="borderless">
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading cancellation statistics...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="borderless">
        <Alert
          type="error"
          showIcon
          message="Error Loading Data"
          description={error}
          action={
            <Button 
              type="primary" 
              size="small" 
              onClick={fetchCancellationStats}
            >
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>Therapist Cancellation Performance</span>
        </Space>
      }
      variant="borderless"
    >
      {stats.length === 0 ? (
        <Empty 
          description="No therapists found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={stats}
          rowKey={(record) => record.therapistName}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} therapists`,
          }}
          scroll={{ x: 800 }}
          size="middle"
          bordered
          locale={{
            emptyText: 'No therapists available'
          }}
        />
      )}

      {/* Summary Statistics */}
      {stats.length > 0 && (
        <Card 
          size="small" 
          style={{ marginTop: '24px', background: '#f5f5f5' }}
          variant="borderless"
        >
          <Title level={5} style={{ marginBottom: '16px' }}>Summary Statistics</Title>
          <Space size="large" wrap>
            <div>
              <Text type="secondary">Total Therapists:</Text>
              <br />
              <Text strong style={{ fontSize: '20px' }}>{stats.length}</Text>
            </div>
            <div>
              <Text type="secondary">With Warnings:</Text>
              <br />
              <Text strong style={{ fontSize: '20px', color: '#faad14' }}>
                {stats.filter(s => s.cancelWarnings > 0).length}
              </Text>
            </div>
            <div>
              <Text type="secondary">With Penalties:</Text>
              <br />
              <Text strong style={{ fontSize: '20px', color: '#d32f2f' }}>
                {stats.filter(s => s.bonusPenaltyPercentage > 0).length}
              </Text>
            </div>
            <div>
              <Text type="secondary">Avg Monthly Cancels:</Text>
              <br />
              <Text strong style={{ fontSize: '20px' }}>
                {(stats.reduce((sum, s) => sum + s.monthlyCancelCount, 0) / stats.length).toFixed(1)}
              </Text>
            </div>
          </Space>
        </Card>
      )}
    </Card>
  );
};

export default TherapistCancellationPerformance;
