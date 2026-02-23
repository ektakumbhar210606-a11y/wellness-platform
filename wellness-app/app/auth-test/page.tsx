'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Typography } from 'antd';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;

const AuthTestPage = () => {
  const { isAuthenticated, user, role } = useAuth();
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user, role });
  }, [isAuthenticated, user, role]);

  const testApiCall = async () => {
    try {
      setLoading(true);
      console.log('Testing API call...');
      
      // Test therapists API
      const therapistsResponse = await makeAuthenticatedRequest('/api/business/therapists');
      console.log('Therapists API response:', therapistsResponse);
      
      // Test reviews API
      const reviewsResponse = await makeAuthenticatedRequest('/api/business/reviews');
      console.log('Reviews API response:', reviewsResponse);
      
      setApiTestResult({
        therapists: therapistsResponse,
        reviews: reviewsResponse
      });
    } catch (error) {
      console.error('API test failed:', error);
      setApiTestResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Authentication Test</Title>
      
      <Card title="Current Auth State" style={{ marginBottom: '24px' }}>
        <Text strong>Authenticated: </Text>
        <Text>{isAuthenticated ? 'YES' : 'NO'}</Text>
        <br />
        <Text strong>Role: </Text>
        <Text>{role || 'None'}</Text>
        <br />
        <Text strong>User: </Text>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </Card>
      
      <Card title="API Test">
        <Button 
          type="primary" 
          onClick={testApiCall}
          loading={loading}
          disabled={!isAuthenticated}
        >
          Test API Calls
        </Button>
        
        {apiTestResult && (
          <div style={{ marginTop: '24px' }}>
            <Text strong>API Test Results:</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              maxHeight: '400px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(apiTestResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthTestPage;