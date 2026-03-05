import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, message, Typography, List, Tag, Space, Divider } from 'antd';
import { GiftOutlined, StarOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * RewardsDashboard Component
 * Displays customer reward points, progress, and history
 */
const RewardsDashboard = ({ customerId }) => {
  const [loading, setLoading] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // Fetch reward data on component mount
  useEffect(() => {
    if (customerId) {
      fetchRewardData();
    }
  }, [customerId]);

  const fetchRewardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/rewards/${customerId}`);
      const data = await response.json();
      
      if (data.success) {
        setRewardData(data.data);
      } else {
        message.error('Failed to fetch reward data');
      }
    } catch (error) {
      console.error('Error fetching reward data:', error);
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) {
    return (
      <Card>
        <Text type="secondary">Customer ID is required to display rewards</Text>
      </Card>
    );
  }

  if (!rewardData) {
    return (
      <Card loading={loading}>
        <Text>Loading reward information...</Text>
      </Card>
    );
  }

  const { 
    rewardPoints, 
    maxPoints, 
    discountUnlocked, 
    pointsRemaining,
    customerName,
    rewardHistory 
  } = rewardData;

  const progressPercentage = (rewardPoints / maxPoints) * 100;
  const progressColor = discountUnlocked ? '#52c41a' : '#1890ff';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header Card */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Rewards Dashboard
          </Title>
          <Text type="secondary">Welcome back, {customerName}!</Text>
        </div>
      </Card>

      {/* Reward Points Progress Card */}
      <Card 
        title={
          <Space>
            <TrophyOutlined style={{ color: discountUnlocked ? '#52c41a' : '#faad14' }} />
            <span>Your Reward Progress</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Progress Display */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={1} style={{ color: progressColor, margin: 0 }}>
              {rewardPoints} / {maxPoints}
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Reward Points
            </Text>
          </div>
      
          {/* Progress Bar */}
          <Progress
            percent={progressPercentage}
            strokeColor={progressColor}
            trailColor="#f5f5f5"
            size="large"
            format={() => `${Math.round(progressPercentage)}%`}
            status={discountUnlocked ? 'success' : 'active'}
          />
      
          {/* Status Message */}
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            borderRadius: 8,
            background: discountUnlocked ? '#f6ffed' : '#e6f7ff',
            border: `1px solid ${discountUnlocked ? '#b7eb8f' : '#91d5ff'}`
          }}>
            {discountUnlocked ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                <div>
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    🎉 Congratulations! Your 10% discount is unlocked
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Use your discount on your next booking. Points will reset after use.
                  </Text>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <StarOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                <div>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    Keep reviewing to unlock a 10% discount
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    {pointsRemaining} more points needed to unlock your discount
                  </Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">+5 points per review</Tag>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Quick Stats</Title>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Current Points:</Text>
            <Text strong>{rewardPoints}</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Points Remaining:</Text>
            <Text strong>{pointsRemaining}</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Discount Status:</Text>
            <Tag color={discountUnlocked ? 'green' : 'default'}>
              {discountUnlocked ? '✓ Unlocked' : '🔒 Locked'}
            </Tag>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Reward History:</Text>
            <Text strong>{rewardHistory?.length || 0} entries</Text>
          </div>
        </Space>
      </Card>

      {/* Reward History */}
      <Card 
        title={
          <Space>
            <GiftOutlined />
            <span>Reward History</span>
          </Space>
        }
      >
        {rewardHistory && rewardHistory.length > 0 ? (
          <List
            dataSource={rewardHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.type === 'REVIEW_REWARD' ? (
                      <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    ) : (
                      <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    )
                  }
                  title={
                    <Space>
                      <Text strong>{item.description}</Text>
                      <Tag color={item.points > 0 ? 'green' : 'red'}>
                        {item.points > 0 ? '+' : ''}{item.points} pts
                      </Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div>
              <Text type="secondary">No reward history yet</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Submit reviews to start earning points!</Text>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RewardsDashboard;
