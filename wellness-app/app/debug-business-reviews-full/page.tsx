'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Spin, Alert, Table } from 'antd';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;

const BusinessReviewsDebug = () => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting debug process...');
      
      // 1. Get current user info
      const userResponse = await makeAuthenticatedRequest('/api/business/me');
      console.log('User info:', userResponse);
      
      // 2. Get therapists for this business
      const therapistsResponse = await makeAuthenticatedRequest('/api/business/therapists');
      console.log('Therapists:', therapistsResponse);
      
      // 3. Get all reviews (without filter)
      const allReviewsResponse = await makeAuthenticatedRequest('/api/business/reviews');
      console.log('All reviews:', allReviewsResponse);
      
      // 4. Get reviews for each therapist individually
      const therapistReviews = [];
      if (therapistsResponse?.data?.approvedTherapists) {
        for (const therapist of therapistsResponse.data.approvedTherapists) {
          try {
            const therapistReviewResponse = await makeAuthenticatedRequest(`/api/business/reviews?therapistId=${therapist.id}`);
            therapistReviews.push({
              therapistId: therapist.id,
              therapistName: therapist.fullName || `${therapist.firstName} ${therapist.lastName}`,
              reviews: therapistReviewResponse.data?.reviews || [],
              error: therapistReviewResponse.error
            });
            console.log(`Reviews for therapist ${therapist.id}:`, therapistReviewResponse);
          } catch (err) {
            therapistReviews.push({
              therapistId: therapist.id,
              therapistName: therapist.fullName || `${therapist.firstName} ${therapist.lastName}`,
              reviews: [],
              error: (err as any).message
            });
          }
        }
      }
      
      setDebugData({
        user: userResponse,
        therapists: therapistsResponse,
        allReviews: allReviewsResponse,
        therapistReviews: therapistReviews
      });
      
    } catch (err: any) {
      console.error('Debug error:', err);
      setError(err.message || 'Failed to fetch debug data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Therapist',
      dataIndex: 'therapistName',
      key: 'therapistName',
    },
    {
      title: 'Therapist ID',
      dataIndex: 'therapistId',
      key: 'therapistId',
    },
    {
      title: 'Review Count',
      dataIndex: 'reviews',
      key: 'reviewCount',
      render: (reviews: any[]) => reviews?.length || 0
    },
    {
      title: 'Status',
      dataIndex: 'error',
      key: 'status',
      render: (error: string) => error ? 
        <Text type="danger">Error: {error}</Text> : 
        <Text type="success">Success</Text>
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading debug data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Business Reviews Debug</Title>
      
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '24px' }}
        />
      )}
      
      <Button 
        onClick={fetchData} 
        style={{ marginBottom: '24px' }}
      >
        Refresh Debug Data
      </Button>
      
      {debugData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User Info */}
          <Card title="Business User Info">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(debugData.user, null, 2)}
            </pre>
          </Card>
          
          {/* Therapists */}
          <Card title="Therapists">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(debugData.therapists, null, 2)}
            </pre>
          </Card>
          
          {/* All Reviews */}
          <Card title="All Business Reviews">
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {JSON.stringify(debugData.allReviews, null, 2)}
            </pre>
          </Card>
          
          {/* Per-Therapist Reviews */}
          <Card title="Per-Therapist Reviews">
            <Table 
              dataSource={debugData.therapistReviews}
              columns={columns}
              rowKey="therapistId"
              pagination={false}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default BusinessReviewsDebug;