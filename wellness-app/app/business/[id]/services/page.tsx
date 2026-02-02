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
  
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Extract businessId from params once at component mount
  useEffect(() => {
    const extractBusinessId = async () => {
      if (params && params.id) {
        // Handle potential promise for params.id
        const idValue = await Promise.resolve(params.id);
        if (idValue) {
          setBusinessId(idValue as string);
        }
      }
    };
    
    extractBusinessId();
  }, [params]);
  
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [therapistsLoading, setTherapistsLoading] = useState(false);
  const [therapistsError, setTherapistsError] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<any | null>(null);
  const { user } = useAuth();

  // Create a map of service ID to therapists for quick lookup
  const serviceTherapistsMap = services.reduce((acc, service) => {
    acc[service._id] = service.therapists || [];
    return acc;
  }, {} as Record<string, any[]>);

  // Placeholder business data
  const [business, setBusiness] = useState<any>({
    _id: businessId || '',
    name: 'Wellness Center',
    description: 'Premium wellness services for your health and relaxation'
  });

  // Update business data when businessId changes
  useEffect(() => {
    if (businessId) {
      setBusiness({
        _id: businessId,
        name: 'Wellness Center',
        description: 'Premium wellness services for your health and relaxation'
      });
    }
  }, [businessId]);


  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          // Redirect to login page if not authenticated
          router.push('/login');
          return; // Exit early to prevent further execution
        }
        
        if (!businessId) {
          throw new Error('Business ID is required to fetch services');
        }
        
        // Fetch services for this business
        console.log('Fetching services for business ID:', businessId);
        console.log('Business ID type:', typeof businessId);
        console.log('Business ID length:', businessId ? businessId.length : 'undefined');
        console.log('Full URL would be:', `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/services`);
        
        const servicesData = await businessService.getBusinessServices(businessId);
        console.log('Services data received:', servicesData);
        console.log('Services data type:', Array.isArray(servicesData) ? 'array' : typeof servicesData);
        console.log('Services data length:', servicesData.length);
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          console.log('First service:', servicesData[0]);
          console.log('First service _id:', servicesData[0]._id);
          console.log('First service therapists:', servicesData[0].therapists);
        }
        setServices(servicesData);
      } catch (err) {
        console.error('Error fetching business services:', err);
        console.error('Business ID was:', businessId);
        
        // Handle specific error cases
        if (err instanceof Error) {
          if (err.message.includes('Business not found') || err.message.includes('404')) {
            setError('Business not found');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load services');
        }
        
        setServices([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    if (businessId) {
      fetchServices();
    } else {
      console.log('Business ID not available, skipping services fetch');
    }
  }, [businessId]);

  // Set therapists when a service is selected (using local data)
  useEffect(() => {
    if (selectedServiceId && serviceTherapistsMap[selectedServiceId]) {
      console.log('Setting therapists from local data for service:', selectedServiceId);
      console.log('Therapists data:', serviceTherapistsMap[selectedServiceId]);
      console.log('Therapists data type:', Array.isArray(serviceTherapistsMap[selectedServiceId]) ? 'array' : typeof serviceTherapistsMap[selectedServiceId]);
      console.log('Therapists data length:', serviceTherapistsMap[selectedServiceId].length);
      setTherapists(serviceTherapistsMap[selectedServiceId]);
      setTherapistsLoading(false);
      setTherapistsError(null);
    } else if (selectedServiceId) {
      console.log('No therapists found in local data for service:', selectedServiceId);
      setTherapists([]);
      setTherapistsLoading(false);
      setTherapistsError(null);
    }
  }, [selectedServiceId, serviceTherapistsMap]);

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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {services.map((service) => (
                      <Card 
                        key={service._id}
                        hoverable
                        style={{ 
                          borderRadius: 8, 
                          boxShadow: selectedServiceId === service._id 
                            ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer',
                          height: '100%',
                          border: selectedServiceId === service._id 
                            ? '2px solid #1890ff' 
                            : '1px solid #f0f0f0'
                        }}
                        onClick={() => {
                          // Track the selected service ID in state to display therapists
                          console.log('Service card clicked, setting service ID:', service._id);
                          console.log('Service ID type:', typeof service._id, 'Service ID value:', service._id);
                          console.log('Service ID length:', service._id ? service._id.length : 'undefined');
                          setSelectedServiceId(service._id);
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <div style={{ flex: 1 }}>
                            <Title level={4} style={{ marginBottom: 8, color: '#262626' }}>{service.name}</Title>
                            <Paragraph style={{ marginBottom: 12, color: '#666', flex: 1 }} ellipsis={{ rows: 2 }}>
                              {service.description}
                            </Paragraph>
                            {/* Display assigned therapists count */}
                            {service.therapists && service.therapists.length > 0 && (
                              <div style={{ marginTop: '12px', fontSize: '14px', color: '#8c8c8c' }}>
                                👤 {service.therapists.length} assigned therapist{service.therapists.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
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
                title={
                  selectedServiceId 
                    ? [
                        <span key="title">Therapists for Selected Service</span>,
                        <Button 
                          key="clear"
                          type="link" 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering card click
                            setSelectedServiceId(null);
                            setTherapists([]); // Clear therapists list
                            setSelectedTherapist(null); // Clear selected therapist
                          }}
                          style={{ float: 'right', padding: 0 }}
                        >
                          Clear Selection
                        </Button>
                      ]
                    : "Select a Service"
                }
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
                          boxShadow: selectedTherapist?._id === therapist._id
                            ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          cursor: 'pointer',
                          border: selectedTherapist?._id === therapist._id
                            ? '2px solid #1890ff' 
                            : '1px solid #f0f0f0',
                          backgroundColor: selectedTherapist?._id === therapist._id
                            ? '#f0faff' 
                            : '#ffffff'
                        }}
                        onClick={() => {
                          // Set the selected therapist
                          setSelectedTherapist(therapist);
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
                ) : selectedServiceId ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No therapists assigned to this service yet"
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Please select a service to see available therapists"
                    />
                  </div>
                )}
                
                {/* Book Now Button - appears when a therapist is selected */}
                {selectedTherapist && (
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Button 
                      type="primary" 
                      size="large" 
                      style={{ padding: '0 32px', height: '40px', fontSize: '16px' }}
                      onClick={() => {
                        if (businessId && selectedServiceId && selectedTherapist?._id) {
                          router.push(`/booking/slot-selector?businessId=${businessId}&serviceId=${selectedServiceId}&therapistId=${selectedTherapist._id}`);
                        }
                      }}
                    >
                      Book Now
                    </Button>
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