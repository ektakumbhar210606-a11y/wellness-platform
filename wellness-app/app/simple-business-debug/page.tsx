'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Spin, Alert } from 'antd';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;

const SimpleBusinessDebug = () => {
  const [therapistsData, setTherapistsData] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching business data...');
      
      // Fetch therapists data
      const therapistsResponse = await makeAuthenticatedRequest('/api/business/therapists');
      console.log('Therapists response:', therapistsResponse);
      setTherapistsData(therapistsResponse);
      
      // Fetch reviews data
      const reviewsResponse = await makeAuthenticatedRequest('/api/business/reviews');
      console.log('Reviews response:', reviewsResponse);
      setReviewsData(reviewsResponse);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

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
        Refresh Data
      </Button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Therapists Data */}
        <Card title="Therapists API Response">
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(therapistsData, null, 2)}
          </pre>
        </Card>
        
        {/* Reviews Data */}
        <Card title="Reviews API Response">
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(reviewsData, null, 2)}
          </pre>
        </Card>
      </div>
      
      {/* Summary */}
      <Card title="Analysis" style={{ marginTop: '24px' }}>
        <div>
          <Text strong>Business Status: </Text>
          <Text>{therapistsData?.success ? 'VERIFIED' : 'UNKNOWN'}</Text>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Text strong>Approved Therapists: </Text>
          <Text>{therapistsData?.data?.approvedTherapists?.length || 0}</Text>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Text strong>Reviews Found: </Text>
          <Text>{reviewsData?.data?.reviews?.length || 0}</Text>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Text strong>API Status: </Text>
          <Text type={reviewsData?.success ? 'success' : 'danger'}>
            {reviewsData?.success ? 'SUCCESS' : 'FAILED'}
          </Text>
        </div>
        {reviewsData?.data?.reviews?.length === 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
            <Text strong type="danger">No reviews found. Possible issues:</Text>
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              <li>No approved therapists for this business</li>
              <li>Therapists haven't received any reviews yet</li>
              <li>Data relationship issues still exist</li>
              <li>Authentication/authorization problems</li>
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SimpleBusinessDebug;