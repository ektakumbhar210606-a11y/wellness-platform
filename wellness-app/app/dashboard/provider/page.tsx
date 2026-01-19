'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Spin, message, Space } from 'antd';
import { UserOutlined, CalendarOutlined, StarOutlined, DollarOutlined, ShopOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { businessService, BusinessProfile } from '@/app/services/businessService';
import ServiceModal from '@/app/components/ServiceModal';
import ServiceCard from '@/app/components/ServiceCard';

const { Title, Text } = Typography;

const ProviderDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = React.useCallback(async () => {
    try {
      setServicesLoading(true);
      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found. User is not logged in.');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/my-services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch services');
      }
      
      setServices(result.services || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      message.error(error.message || 'An error occurred while fetching services');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      if (user.role.toLowerCase() === 'customer') {
        router.push('/dashboard/customer');
      } else if (user.role.toLowerCase() === 'therapist') {
        router.push('/dashboard/therapist');
      } else {
        router.push('/');
      }
      return;
    }
    
    // Fetch business profile to determine if onboarding is complete
    const fetchBusinessProfile = async () => {
      try {
        const profile = await businessService.getBusinessProfile();
        setBusiness(profile);
        // Fetch services after getting business profile
        await fetchServices();
      } catch (error: any) {
        console.error('Error fetching business profile:', error);
        message.error(error.message || 'Failed to fetch business profile');
        // If profile doesn't exist, redirect to onboarding
        if (error.status === 404) {
          router.push('/onboarding/provider');
        }
        return; // Exit early if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [isAuthenticated, user, router]);

  const handleSubmitService = React.useCallback(async (formData: any) => {
    setSubmitting(true);
    try {
      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found. User is not logged in.');
      }
      
      let response;
      let result;
      
      if (editingService) {
        // Update existing service
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        
        result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update service');
        }
        
        message.success('Service updated successfully!');
      } else {
        // Create new service
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        
        result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create service');
        }
        
        message.success('Service created successfully!');
      }
      
      // Refresh services list
      await fetchServices();
      
      // Close modal and reset editing state
      setModalVisible(false);
      setEditingService(null);
      
      return result;
    } catch (error: any) {
      console.error('Error submitting service:', error);
      message.error(error.message || 'An error occurred while submitting the service');
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [editingService, fetchServices]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <Title level={2}>Dashboard</Title>
          <Text>Welcome back! Here's what's happening with your business today.</Text>
        </div>
        
        {business && (
          <div style={{ marginBottom: '30px' }}>
            <Card title="Business Profile" style={{ marginBottom: '20px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <ShopOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px' }}>{business.business_name}</Text>
                      <br />
                      <Text type="secondary">{business.description}</Text>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EnvironmentOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                    <Text>{business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Clients"
                value={24}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Upcoming Appointments"
                value={5}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Avg. Rating"
                value={4.8}
                precision={1}
                prefix={<StarOutlined />}
                styles={{ content: { color: '#3f8600' } }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Revenue"
                value={2450}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Card title="Recent Bookings" style={{ height: '300px' }}>
              <Text>No recent bookings. Keep promoting your services!</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Quick Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button type="primary">View Calendar</Button>
                <Button onClick={() => setModalVisible(true)} icon={<PlusOutlined />}>Manage Services</Button>
                <Button>Update Profile</Button>
                <Button>View Earnings</Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Services Section */}
        <Row gutter={[16, 16]} style={{ marginTop: '30px' }}>
          <Col span={24}>
            <Card title={`My Services (${services.length})`}>
              {servicesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                </div>
              ) : services.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {services.map((service) => (
                    <Col key={service.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                      <ServiceCard
                        service={service}
                        onEdit={(serviceData) => {
                          setEditingService(serviceData);
                          setModalVisible(true);
                        }}
                        onDelete={async (id: string) => {
                          try {
                            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                            if (!token) {
                              throw new Error('Authentication token not found');
                            }
                            
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`, {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                            });
                            
                            const result = await response.json();
                            
                            if (!response.ok) {
                              throw new Error(result.error || 'Failed to delete service');
                            }
                            
                            message.success('Service deleted successfully!');
                            await fetchServices(); // Refresh the list
                          } catch (error: any) {
                            console.error('Error deleting service:', error);
                            message.error(error.message || 'An error occurred while deleting the service');
                          }
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text>You haven't created any services yet. Click "Manage Services" to get started!</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
      <ServiceModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingService(null); // Reset editing state when closing
        }}
        onSubmit={handleSubmitService}
        loading={submitting}
      />
    </>
  );
};

export default ProviderDashboard;