'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Breadcrumb, Spin, Empty, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

import Link from 'next/link';
import { businessService } from '@/app/services/businessService';
import { useAuth } from '@/app/context/AuthContext';

const { Title, Paragraph } = Typography;

export default function BusinessServicesPage() {
  const router = useRouter();
  const params = useParams();
  
  const businessId = params?.businessId as string;
  
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [therapistsError, setTherapistsError] = useState<string | null>(null);
  const { user } = useAuth();

  // Placeholder business data
  const [business] = useState({
    _id: businessId,
    name: 'Wellness Center',
    description: 'Premium wellness services for your health and relaxation'
  });


  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch services for this business
        console.log('Fetching services for business ID:', businessId);
        const servicesData = await businessService.getBusinessServices(businessId);
        console.log('Services data received:', servicesData);
        setServices(servicesData);
      } catch (err) {
        console.error('Error fetching business services:', err);
        console.error('Business ID was:', businessId);
        setError(err instanceof Error ? err.message : 'Failed to load services');
        setServices([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    if (businessId) {
      fetchServices();
    }
  }, [businessId]);

  // Fetch therapists when a service is selected
  useEffect(() => {
    const fetchTherapistsForService = async () => {
      if (!selectedServiceId || !businessId) return;
      
      try {
        setTherapistsLoading(true);
        setTherapistsError(null);
        
        // Get the JWT token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('Authentication token not found. User is not logged in.');
        }
        
        // Get the base API URL from environment variables
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
        }
        
        // Construct the full URL
        const url = `${baseUrl}/api/businesses/${businessId}/services/${selectedServiceId}/therapists`;
        
        // Make the GET request with authorization header
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        const therapistsData = await response.json();
        setTherapists(therapistsData);
      } catch (err) {
        console.error('Error fetching therapists for service:', err);
        setTherapistsError(err instanceof Error ? err.message : 'Failed to load therapists');
        setTherapists([]); // Set empty array on error
      } finally {
        setTherapistsLoading(false);
      }
    };
    
    fetchTherapistsForService();
  }, [selectedServiceId, businessId]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <Breadcrumb 
            style={{ marginBottom: 24 }} 
            items={[
              { title: <Link href="/">Home</Link> },
              { title: <Link href="/search">Businesses</Link> },
              { title: business?.name || 'Business' },
              { title: "Services" }
            ]}
          />
          
          {/* Page Title */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>{business?.name || 'Business'} Services</Title>
            <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
              {business?.description || 'Discover our premium wellness services'}
            </Paragraph>
          </div>
          
          {/* Main Content Grid - Services (left) and Therapists (right) */}
          <Row gutter={[32, 32]}>
            {/* Left Section - Services List */}
            <Col xs={24} md={16}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  height: '100%'
                }}
                title="Available Services"
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                  </div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={`Error loading services: ${error}`}
                    />
                  </div>
                ) : services && services.length > 0 ? (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {services.map((service) => (
                      <Card 
                        key={service._id}
                        hoverable
                        style={{ 
                          borderRadius: 8, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          // Track the selected service ID in state
                          setSelectedServiceId(service._id);
                          
                          // Navigate to book this service (maintaining existing behavior)
                          router.push(`/services/${service._id}/book`);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Title level={4} style={{ marginBottom: 8, color: '#262626' }}>{service.name}</Title>
                            <Paragraph style={{ marginBottom: 8, color: '#666' }}>
                              {service.description}
                            </Paragraph>
                            <div style={{ display: 'flex', gap: '16px', color: '#8c8c8c', fontSize: '14px' }}>
                              <span>⏱️ {service.duration} min</span>
                              <span>💰 ${service.price}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No services available for this business yet"
                    />
                  </div>
                )}
              </Card>
            </Col>
            
            {/* Right Section - Therapists List */}
            <Col xs={24} md={8}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  height: '100%'
                }}
                title="Available Therapists"
              >
                {therapistsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                  </div>
                ) : therapistsError ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={`Error loading therapists: ${therapistsError}`}
                    />
                  </div>
                ) : therapists && therapists.length > 0 ? (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {therapists.map((therapist) => (
                      <Card 
                        key={therapist._id}
                        hoverable
                        style={{ 
                          borderRadius: 8, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            backgroundColor: '#f0f0f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}>
                            <span style={{ fontSize: '20px' }}>👤</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Title level={5} style={{ marginBottom: 4 }}>{therapist.name || `${therapist.firstName} ${therapist.lastName}`}</Title>
                            <Paragraph style={{ marginBottom: 2, color: '#666', fontSize: '14px' }}>{therapist.specialty}</Paragraph>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#52c41a', fontSize: '16px' }}>●</span>
                              <span style={{ fontSize: '12px', color: '#666' }}>{therapist.status || 'Active'}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No therapists assigned to this service yet"
                    />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Layout.Content>
    </Layout>
  );
}