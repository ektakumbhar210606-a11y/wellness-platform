'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, message } from 'antd';

export default function TestTherapistsAPI() {
  const [businessId, setBusinessId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    if (!businessId || !serviceId) {
      message.error('Please enter both Business ID and Service ID');
      return;
    }

    setLoading(true);
    try {
      // Get the JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found. User is not logged in.');
      }

      console.log('Testing with businessId:', businessId, 'serviceId:', serviceId);
      console.log('businessId type:', typeof businessId, 'serviceId type:', typeof serviceId);
      console.log('businessId length:', businessId.length, 'serviceId length:', serviceId.length);

      // Use relative URL for API calls to let Next.js handle routing
      const apiUrl = `/api/businesses/${businessId}/services/${serviceId}/therapists`;
      console.log('API URL being called:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        throw new Error(`API Error: ${response.status} - ${responseText}`);
      }

      const data = await response.json();
      console.log('Success! Data received:', data);
      setResult(data);
      message.success('API call successful!');
    } catch (error) {
      console.error('API call failed:', error);
      const errorMessage = (error as Error).message;
      message.error(`API call failed: ${errorMessage}`);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Therapists API</h1>
      
      <Card title="API Test Parameters" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label>Business ID:</label>
          <Input 
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="Enter business ID"
            style={{ marginTop: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label>Service ID:</label>
          <Input 
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="Enter service ID"
            style={{ marginTop: '8px' }}
          />
        </div>
        
        <Button 
          type="primary" 
          onClick={testAPI}
          loading={loading}
        >
          Test API Call
        </Button>
      </Card>

      {result && (
        <Card title="API Response">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}