'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Card, Spin, Empty, Button } from 'antd';
import Navbar from '@/app/components/Navbar';

const { Title, Text } = Typography;

export default function TestServiceTherapistPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/test-service-therapist-data');
        const result = await response.json();
        
        if (response.ok) {
          setData(result);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ marginBottom: 24 }}>Service-Therapist Relationship Test</Title>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading data...</div>
            </div>
          ) : error ? (
            <Card>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`Error: ${error}`}
              />
            </Card>
          ) : data ? (
            <div>
              <Card style={{ marginBottom: 24 }}>
                <Title level={4}>Summary</Title>
                <Text>Total Services: {data.totalServices}</Text><br />
                <Text>Services with Therapists: {data.servicesWithTherapists}</Text>
              </Card>
              
              <Card>
                <Title level={4}>Services with Assigned Therapists</Title>
                {data.servicesWithTherapists > 0 ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {data.servicesWithTherapists.map((service: any) => (
                      <Card key={service.id} size="small">
                        <Title level={5} style={{ margin: '0 0 8px 0' }}>
                          {service.name}
                        </Title>
                        <Text type="secondary">
                          {service.therapistCount} therapist{service.therapistCount !== 1 ? 's' : ''} assigned:
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          {service.therapists.map((therapist: any) => (
                            <div key={therapist.id} style={{ 
                              display: 'inline-block', 
                              backgroundColor: '#f0f0f0', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              marginRight: '8px',
                              marginBottom: '4px'
                            }}>
                              {therapist.fullName} (ID: {therapist.id})
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty description="No services with assigned therapists found" />
                )}
              </Card>
            </div>
          ) : (
            <Card>
              <Empty description="No data available" />
            </Card>
          )}
        </div>
      </Layout.Content>
    </Layout>
  );
}