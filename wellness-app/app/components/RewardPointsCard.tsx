'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Statistic, Space, Spin, Alert, Button } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface RewardPointsData {
  rewardPoints: number;
}

interface RewardPointsCardProps {
  onRefresh?: () => void;
}

const RewardPointsCard: React.FC<RewardPointsCardProps> = ({ onRefresh }) => {
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewardPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/customer/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reward points');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setRewardPoints(data.data.rewardPoints);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching reward points:', err);
      setError(err.message || 'Failed to fetch reward points');
      setRewardPoints(0); // Default to 0 on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardPoints();
  }, []);

  // Listen for review submission events to refresh reward points
  useEffect(() => {
    const handleReviewSubmitted = () => {
      fetchRewardPoints();
    };

    window.addEventListener('reviewSubmitted', handleReviewSubmitted);
    
    return () => {
      window.removeEventListener('reviewSubmitted', handleReviewSubmitted);
    };
  }, []);

  const handleRefresh = () => {
    fetchRewardPoints();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Card 
      style={{ 
        borderRadius: '12px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        minHeight: 180
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              marginBottom: '8px',
              fontWeight: 600
            }}
          >
            My Reward Points
          </Title>
          
          {loading ? (
            <div style={{ marginBottom: '16px' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                action={
                  <Button 
                    type="link" 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    style={{ color: 'white' }}
                  >
                    Retry
                  </Button>
                }
              />
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <Statistic
                value={rewardPoints ?? 0}
                styles={{ content: { 
                  color: 'white', 
                  fontSize: '48px', 
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                } }}
                prefix={
                  <TrophyOutlined 
                    style={{ 
                      fontSize: '32px', 
                      marginRight: '8px',
                      verticalAlign: 'middle'
                    }} 
                  />
                }
                suffix={
                  <Text 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '16px',
                      marginLeft: '8px',
                      verticalAlign: 'middle'
                    }}
                  >
                    pts
                  </Text>
                }
              />
            </div>
          )}
          
          <Text 
            style={{ 
              color: 'rgba(255, 255, 255, 0.85)', 
              fontSize: '14px',
              display: 'block',
              lineHeight: 1.5
            }}
          >
            Earn points by completing bookings and submitting reviews.
          </Text>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <Button 
            type="text" 
            icon={<ReloadOutlined style={{ color: 'white' }} />} 
            onClick={handleRefresh}
            loading={loading}
            style={{ 
              color: 'white',
              opacity: 0.8
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default RewardPointsCard;