'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Spin, Alert, Space, Tag, Row, Col, Statistic, Progress, Divider } from 'antd';
import { WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CancellationData {
  monthlyCancelCount: number;
  totalCancelCount: number;
  cancelWarnings: number;
  bonusPenaltyPercentage: number;
}

const TherapistCancellationCard = () => {
  const [data, setData] = useState<CancellationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCancellationData();
  }, []);

  const fetchCancellationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/therapist/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile data');
      }

      if (result.success && result.data) {
        // Extract cancellation data from therapist profile
        setData({
          monthlyCancelCount: result.data.monthlyCancelCount || 0,
          totalCancelCount: result.data.totalCancelCount || 0,
          cancelWarnings: result.data.cancelWarnings || 0,
          bonusPenaltyPercentage: result.data.bonusPenaltyPercentage || 0,
        });
      } else {
        throw new Error('Failed to fetch cancellation data');
      }
    } catch (err: any) {
      console.error('Error fetching cancellation data:', err);
      setError(err.message || 'Failed to load cancellation performance');
    } finally {
      setLoading(false);
    }
  };

  // Determine color based on monthly cancellations
  const getMonthlyCancelColor = (count: number): string => {
    if (count <= 2) return '#52c41a'; // Green
    if (count <= 4) return '#faad14'; // Yellow
    if (count <= 6) return '#ff7a45'; // Orange
    return '#d32f2f'; // Red
  };

  // Determine color for penalty percentage
  const getPenaltyColor = (percentage: number): string => {
    if (percentage === 0) return '#52c41a'; // Green
    if (percentage <= 10) return '#faad14'; // Yellow
    if (percentage <= 25) return '#ff7a45'; // Orange
    return '#d32f2f'; // Red
  };

  // Get warning status
  const getWarningStatus = () => {
    if (!data || data.cancelWarnings === 0) {
      return {
        text: 'None',
        color: 'success' as const,
        icon: <CheckCircleOutlined />
      };
    }
    return {
      text: 'Active',
      color: 'warning' as const,
      icon: <WarningOutlined />
    };
  };

  // Calculate performance score (inverse of penalty)
  const performanceScore = data ? 100 - data.bonusPenaltyPercentage : 0;

  if (loading) {
    return (
      <Card variant="borderless">
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading cancellation performance...</Text>
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
            <button 
              onClick={fetchCancellationData}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#1890ff', 
                cursor: 'pointer' 
              }}
            >
              Retry
            </button>
          }
        />
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const warningStatus = getWarningStatus();
  const monthlyColor = getMonthlyCancelColor(data.monthlyCancelCount);
  const penaltyColor = getPenaltyColor(data.bonusPenaltyPercentage);

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: '#667eea' }} />
          <span>Cancellation Performance</span>
        </Space>
      }
      variant="borderless"
      size="small"
      style={{ marginTop: '16px' }}
    >
      <Row gutter={[16, 16]}>
        {/* Monthly Cancellations */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Monthly Cancellations
            </Text>
            <Title level={3} style={{ margin: '8px 0', color: monthlyColor }}>
              {data.monthlyCancelCount}
            </Title>
            <Tag color={monthlyColor}>
              {data.monthlyCancelCount <= 2 ? 'Good' : 
               data.monthlyCancelCount <= 4 ? 'Caution' : 
               data.monthlyCancelCount <= 6 ? 'High' : 'Critical'}
            </Tag>
          </div>
        </Col>

        {/* Total Cancellations */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Total Cancellations
            </Text>
            <Title level={3} style={{ margin: '8px 0', color: '#1890ff' }}>
              {data.totalCancelCount}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>Lifetime</Text>
          </div>
        </Col>

        {/* Warning Status */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Warning Status
            </Text>
            <div style={{ margin: '8px 0' }}>
              <Tag color={warningStatus.color} icon={warningStatus.icon} style={{ fontSize: '14px' }}>
                {warningStatus.text}
              </Tag>
            </div>
            {data.cancelWarnings > 0 && (
              <Text type="warning" style={{ fontSize: '12px' }}>
                Action required
              </Text>
            )}
          </div>
        </Col>

        {/* Bonus Penalty */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Bonus Penalty
            </Text>
            <Title level={3} style={{ margin: '8px 0', color: penaltyColor }}>
              {data.bonusPenaltyPercentage}%
            </Title>
            <Progress
              percent={performanceScore}
              strokeColor={penaltyColor}
              railColor="#f0f0f0"
              showInfo={false}
              size="small"
              format={() => ''}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Performance: {performanceScore}%
            </Text>
          </div>
        </Col>
      </Row>

      {/* Additional Info Section */}
      {(data.monthlyCancelCount > 0 || data.bonusPenaltyPercentage > 0) && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                <strong>Note:</strong> Your cancellation performance affects your bonus eligibility.
              </Text>
              {data.monthlyCancelCount >= 3 && (
                <Text type="warning" style={{ fontSize: '13px' }}>
                  ⚠️ You have {data.monthlyCancelCount} cancellations this month. Try to reduce cancellations to maintain full bonus.
                </Text>
              )}
              {data.bonusPenaltyPercentage > 0 && (
                <Text type="danger" style={{ fontSize: '13px' }}>
                  ⚠️ A {data.bonusPenaltyPercentage}% penalty is currently applied to your bonuses.
                </Text>
              )}
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};

export default TherapistCancellationCard;
