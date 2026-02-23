'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Rate, 
  Typography, 
  Space, 
  Spin, 
  Alert,
  Row,
  Col,
  Divider,
  Pagination
} from 'antd';
import { StarOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;

interface Review {
  rating: number;
  comment?: string;
  customerName: string;
  serviceName: string;
  createdAt: Date;
}

interface TherapistStats {
  averageRating: number;
  totalReviews: number;
}

const TherapistReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<TherapistStats>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest('/api/therapist/reviews');
      
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setStats(response.data.therapist || { averageRating: 0, totalReviews: 0 });
      } else {
        setError(response.error || 'Failed to fetch reviews');
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderReviewItem = (review: Review) => (
    <Card 
      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '16px' }}
      styles={{ body: { padding: '20px' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Customer and Service Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <Text strong style={{ fontSize: '16px' }}>{review.customerName}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>Service: {review.serviceName}</Text>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <Rate 
              disabled 
              value={review.rating} 
              style={{ fontSize: '18px' }}
            />
          </div>
        </div>
        
        {/* Comment */}
        {review.comment && (
          <div style={{ 
            backgroundColor: '#fafafa', 
            padding: '12px', 
            borderRadius: '6px',
            borderLeft: '3px solid #1890ff'
          }}>
            <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>"{review.comment}"</Text>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading reviews...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Error Loading Reviews"
          description={error}
          type="error"
          showIcon
          action={
            <a onClick={fetchReviews} style={{ cursor: 'pointer' }}>
              Retry
            </a>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px', color: '#1d3557' }}>
        My Reviews
      </Title>
      
      {/* Statistics Summary - Clean Top Display */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>
                <StarOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1d3557', marginBottom: '4px' }}>
                {stats.averageRating.toFixed(1)}
              </div>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Average Rating
              </Text>
            </div>
          </Col>
          
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                {stats.totalReviews}
              </div>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Total Reviews
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* Reviews List */}
      <div>
        <Title level={4} style={{ marginBottom: '16px', color: '#1d3557' }}>
          Recent Reviews
        </Title>
        
        {reviews.length > 0 ? (
          <div>
            {reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((review, index) => (
              <div key={index}>
                {renderReviewItem(review)}
              </div>
            ))}
            {reviews.length > pageSize && (
              <Pagination
                current={currentPage}
                total={reviews.length}
                pageSize={pageSize}
                showSizeChanger
                showQuickJumper
                showTotal={(total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} reviews`}
                style={{ marginTop: '20px', textAlign: 'center' }}
                onChange={(page, pageSize) => {
                  setCurrentPage(page);
                }}
              />
            )}
          </div>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <StarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} style={{ marginBottom: '12px' }}>No Reviews Yet</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              You don't have any reviews yet. Reviews will appear here after customers complete their bookings.
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TherapistReviews;