'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Spin, message, Space, Tabs, Modal, Tag } from 'antd';
import { UserOutlined, CalendarOutlined, StarOutlined, DollarOutlined, ShopOutlined, EnvironmentOutlined, PlusOutlined, TeamOutlined, BookOutlined, ProfileOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { businessService, BusinessProfile, BusinessDashboardStats } from '@/app/services/businessService';
import ServiceModal from '@/app/components/ServiceModal';
import ProviderOnboarding from '@/app/components/ProviderOnboarding';
import ServiceCard from '@/app/components/ServiceCard';
import TherapistRequestCard from '@/app/components/TherapistRequestCard';

const { Title, Text } = Typography;

const ProviderDashboardContent = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<BusinessDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingBusinessHours, setEditingBusinessHours] = useState(false);

  // Fetch dashboard statistics
  const fetchDashboardStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      const stats = await businessService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      message.error(error.message || 'Failed to load dashboard statistics');
      // Set default values on error
      setDashboardStats({
        totalClients: 0,
        upcomingAppointments: 0,
        avgRating: 0,
        totalRevenue: 0,
        totalServices: 0,
        pendingTherapistRequests: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch therapist requests
  const fetchTherapistRequests = React.useCallback(async () => {
    try {
      setRequestsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/therapists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch therapist requests');
      }
      
      // Combine pending and approved therapists into one list with status
      const allRequests = [
        ...(result.data.pendingTherapists || []).map((therapist: any) => ({
          ...therapist,
          status: 'pending'
        })),
        ...(result.data.approvedTherapists || []).map((therapist: any) => ({
          ...therapist,
          status: 'approved'
        }))
      ];
      
      setRequests(allRequests);
    } catch (error: any) {
      console.error('Error fetching therapist requests:', error);
      message.error(error.message || 'Failed to load therapist requests');
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // Handle approve request
  const handleApproveRequest = async (therapistId: string) => {
    try {
      setRequestActionLoading(therapistId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/approve-therapist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          therapistId,
          action: 'approve'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve therapist');
      }
      
      message.success('Therapist approved successfully!');
      // Refresh the requests list
      await fetchTherapistRequests();
    } catch (error: any) {
      console.error('Error approving therapist:', error);
      message.error(error.message || 'Failed to approve therapist');
    } finally {
      setRequestActionLoading(null);
    }
  };

  // Handle reject request
  const handleRejectRequest = async (therapistId: string) => {
    try {
      setRequestActionLoading(therapistId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/approve-therapist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          therapistId,
          action: 'reject'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject therapist');
      }
      
      message.success('Therapist request rejected');
      // Refresh the requests list
      await fetchTherapistRequests();
    } catch (error: any) {
      console.error('Error rejecting therapist:', error);
      message.error(error.message || 'Failed to reject therapist');
    } finally {
      setRequestActionLoading(null);
    }
  };


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

  // Effect for initial data loading, authentication check, and URL parameter handling
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
    
    // Set active tab based on URL parameter (unified approach)
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'services', 'bookings', 'requests', 'profile', 'schedule'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('dashboard');
    }
    
    // Fetch business profile to determine if onboarding is complete
    const fetchBusinessProfile = async () => {
      try {
        const profile = await businessService.getBusinessProfile();
        setBusiness(profile);
        // Fetch services after getting business profile
        await fetchServices();
        
        // If we're on the dashboard tab, also fetch dashboard stats
        if (activeTab === 'dashboard') {
          await fetchDashboardStats();
        }
      } catch (error: any) {
        // For 404 errors (business not found), just redirect to onboarding without showing error
        if (error.status === 404) {
          router.push('/onboarding/provider');
        } else {
          // For other errors, log and show error message
          console.error('Error fetching business profile:', error);
          message.error(error.message || 'Failed to fetch business profile');
          return; // Exit early if there's an error
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [isAuthenticated, user, router, searchParams]);
  
  // Effect to log business data when it changes
  useEffect(() => {
    console.log('Business data changed:', business);
  }, [business]);
  
  // Effect to update active tab when URL parameters change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'services', 'bookings', 'requests', 'profile', 'schedule'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('dashboard');
    }
  }, [searchParams]);
  
  // Effect to handle tab-specific data fetching
  useEffect(() => {
    if (activeTab === 'requests' && business) {
      fetchTherapistRequests();
    }
    if (activeTab === 'dashboard' && business) {
      fetchDashboardStats();
    }
    // Add any other tab-specific data fetching here if needed
  }, [activeTab, business, fetchTherapistRequests, fetchDashboardStats]);
  
  // Periodically refresh dashboard stats when on dashboard tab
  useEffect(() => {
    if (activeTab === 'dashboard' && business && !statsLoading) {
      const interval = setInterval(() => {
        fetchDashboardStats();
      }, 60000); // Refresh every minute
      
      return () => clearInterval(interval);
    }
  }, [activeTab, business, statsLoading, fetchDashboardStats]);
  
  // Effect to handle URL parameter changes via browser history
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabFromUrl = urlParams.get('tab');
        if (tabFromUrl && ['dashboard', 'services', 'bookings', 'requests', 'profile', 'schedule'].includes(tabFromUrl)) {
          setActiveTab(tabFromUrl);
        } else if (!tabFromUrl) {
          setActiveTab('dashboard');
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
  
  // Handle opening business profile edit
  const handleEditBusinessProfile = () => {
    if (business) {
      setEditingBusiness(true);
    } else {
      message.warning('Business profile data is not available yet. Please try again.');
    }
  };
  
  // Handle closing business profile edit
  const handleCloseBusinessEdit = () => {
    setEditingBusiness(false);
  };
  
  // Handle opening business hours edit
  const handleEditBusinessHours = () => {
    if (business) {
      setEditingBusinessHours(true);
    } else {
      message.warning('Business profile data is not available yet. Please try again.');
    }
  };
  
  // Handle closing business hours edit
  const handleCloseBusinessHoursEdit = () => {
    setEditingBusinessHours(false);
  };
  
  // Handle submitting business profile update
  const handleSubmitBusinessProfile = async (formData: any) => {
    try {
      const updateData = {
        business_name: formData.businessName,
        description: formData.businessDescription,
        phone: formData.phoneNumber,
        email: formData.email,
        address: {
          street: formData.address,
          city: formData.city || business?.address.city || 'Default City',
          state: formData.state,
          zipCode: formData.pincode,
          country: formData.country || business?.address.country || 'USA',
        },
        opening_time: formData.openingTime,
        closing_time: formData.closingTime,
        businessHours: formData.businessHours,
        status: formData.status || 'active',
      };
      
      const updatedBusiness = await businessService.updateBusiness(updateData);
      
      // Update the business state with new data
      setBusiness(updatedBusiness);
      
      message.success('Business profile updated successfully!');
      setEditingBusiness(false);
    } catch (error: any) {
      console.error('Error updating business profile:', error);
      message.error(error.message || 'Failed to update business profile');
      throw error;
    }
  };
  
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      <Tabs 
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          // Update URL with query parameter (unified approach)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (key === 'dashboard') {
              url.searchParams.delete('tab');
            } else {
              url.searchParams.set('tab', key);
            }
            window.history.replaceState({}, '', url.toString());
          }
        }}
        items={[{
          key: 'dashboard',
          label: 'Dashboard Overview',
          children: (
            <>
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
                            {business.serviceType && (
                              <div style={{ marginTop: '5px' }}>
                                <Tag color="blue">
                                  {(() => {
                                    switch(business.serviceType) {
                                      case 'massage': return 'Massage Therapy';
                                      case 'spa': return 'Spa Services';
                                      case 'wellness': return 'Wellness Program';
                                      case 'corporate': return 'Corporate Wellness';
                                      default: return business.serviceType;
                                    }
                                  })()}
                                </Tag>
                              </div>
                            )}
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
                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                      </div>
                    ) : (
                      <Statistic
                        title="Total Clients"
                        value={dashboardStats?.totalClients || 0}
                        prefix={<UserOutlined />}
                      />
                    )}
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                      </div>
                    ) : (
                      <Statistic
                        title="Upcoming Appointments"
                        value={dashboardStats?.upcomingAppointments || 0}
                        prefix={<CalendarOutlined />}
                      />
                    )}
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                      </div>
                    ) : (
                      <Statistic
                        title="Avg. Rating"
                        value={dashboardStats?.avgRating || 0}
                        precision={1}
                        prefix={<StarOutlined />}
                        styles={{ content: { color: '#3f8600' } }}
                      />
                    )}
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                      </div>
                    ) : (
                      <Statistic
                        title="Revenue"
                        value={dashboardStats?.totalRevenue || 0}
                        precision={2}
                        prefix={<DollarOutlined />}
                        suffix="USD"
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="Recent Bookings" style={{ height: '300px' }}>
                    <Text>No recent bookings. Keep promoting your services!</Text>
                  </Card>
                </Col>
              </Row>

              {/* Services Section */}
              <Row gutter={[16, 16]} style={{ marginTop: '30px' }}>
                <Col span={24}>
                  <Card title={`My Services (${dashboardStats?.totalServices || services.length})`}>
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
            </>
          ),
        }, {
          key: 'services',
          label: (
            <span>
              <ShopOutlined />
              My Services
            </span>
          ),
          children: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={3}>Manage Services</Title>
                  <Text type="secondary">
                    Create, edit, and manage your business services
                  </Text>
                </Col>
                
                <Col span={24}>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => setModalVisible(true)}
                    >
                      Add New Service
                    </Button>
                  </div>
                  
                  {servicesLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Loading services...</Text>
                      </div>
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
                    <Card>
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <ShopOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                        <Title level={4}>No Services Yet</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          You haven't created any services yet.
                        </Text>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />} 
                          onClick={() => setModalVisible(true)}
                        >
                          Create Your First Service
                        </Button>
                      </div>
                    </Card>
                  )}
                </Col>
              </Row>
            </div>
          ),
        }, {
          key: 'bookings',
          label: (
            <span>
              <BookOutlined />
              Bookings
            </span>
          ),
          children: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={3}>Booking Management</Title>
                  <Text type="secondary">
                    View and manage your bookings
                  </Text>
                </Col>
                
                <Col span={24}>
                  <Card>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <BookOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                      <Title level={4}>No Bookings Yet</Title>
                      <Text type="secondary">
                        Your bookings will appear here once customers start booking your services.
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          ),
        }, {
          key: 'requests',
          label: (
            <span>
              <TeamOutlined />
              Therapist Requests
              {(dashboardStats?.pendingTherapistRequests || requests.filter(r => r.status === 'pending').length) > 0 && (
                <span style={{ 
                  marginLeft: 8, 
                  backgroundColor: '#ff4d4f', 
                  color: 'white', 
                  borderRadius: '50%', 
                  padding: '2px 6px', 
                  fontSize: '12px' 
                }}>
                  {dashboardStats?.pendingTherapistRequests || requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </span>
          ),
          children: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={3}>Therapist Applications</Title>
                  <Text type="secondary">
                    Review and manage therapist requests to join your business
                  </Text>
                </Col>
                
                <Col span={24}>
                  {requestsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>Loading therapist requests...</Text>
                      </div>
                    </div>
                  ) : requests.length > 0 ? (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>
                          Showing {requests.length} request{requests.length !== 1 ? 's' : ''} 
                          ({requests.filter(r => r.status === 'pending').length} pending, 
                          {requests.filter(r => r.status === 'approved').length} approved)
                        </Text>
                      </div>
                      <Row gutter={[16, 16]}>
                        {requests.map((request) => (
                          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={request.id}>
                            <TherapistRequestCard 
                              request={request}
                              onApprove={handleApproveRequest}
                              onReject={handleRejectRequest}
                              loading={requestActionLoading === request.therapistId}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ) : (
                    <Card>
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <TeamOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                        <Title level={4}>No Therapist Requests</Title>
                        <Text type="secondary">
                          There are currently no therapist requests.
                          Therapists will appear here when they request to join your business.
                        </Text>
                      </div>
                    </Card>
                  )}
                </Col>
              </Row>
            </div>
          ),
        }, {
          key: 'profile',
          label: (
            <span>
              <ProfileOutlined />
              Profile
            </span>
          ),
          children: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={3}>Business Profile</Title>
                  <Text type="secondary">
                    Manage your business profile information
                  </Text>
                </Col>
                
                <Col span={24}>
                  <Card>
                    {business ? (
                      <div>
                        <Title level={4} style={{ marginBottom: '20px' }}>Business Information</Title>
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                              <ShopOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                              <div>
                                <Text strong>Business Name:</Text>
                                <br />
                                <Text>{business.business_name}</Text>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                              <EnvironmentOutlined style={{ fontSize: '20px', marginRight: '10px', color: '#667eea' }} />
                              <div>
                                <Text strong>Address:</Text>
                                <br />
                                <Text>
                                  {business.address.street}, {business.address.city}<br />
                                  {business.address.state} {business.address.zipCode}
                                </Text>
                              </div>
                            </div>
                          </Col>
                          
                          <Col span={12}>
                            {business.description && (
                              <div style={{ marginBottom: '15px' }}>
                                <Text strong>Description:</Text>
                                <br />
                                <Text type="secondary">{business.description}</Text>
                              </div>
                            )}
                            
                            {business.serviceType && (
                              <div style={{ marginBottom: '15px' }}>
                                <Text strong>Service Type:</Text>
                                <br />
                                <Tag color="blue">
                                  {(() => {
                                    switch(business.serviceType) {
                                      case 'massage': return 'Massage Therapy';
                                      case 'spa': return 'Spa Services';
                                      case 'wellness': return 'Wellness Program';
                                      case 'corporate': return 'Corporate Wellness';
                                      default: return business.serviceType;
                                    }
                                  })()}
                                </Tag>
                              </div>
                            )}
                            
                            {business.phone && (
                              <div style={{ marginBottom: '15px' }}>
                                <Text strong>Phone:</Text>
                                <br />
                                <Text>{business.phone}</Text>
                              </div>
                            )}
                            
                            {business.email && (
                              <div style={{ marginBottom: '15px' }}>
                                <Text strong>Email:</Text>
                                <br />
                                <Text>{business.email}</Text>
                              </div>
                            )}
                          </Col>
                        </Row>
                        
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                          <Button type="primary" onClick={handleEditBusinessProfile}>Update Business Profile</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <ProfileOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                        <Title level={4}>Profile Management</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          Business profile management functionality coming soon.
                        </Text>
                        <Button>Update Business Profile</Button>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          ),
        }, {
          key: 'schedule',
          label: (
            <span>
              <CalendarOutlined />
              Schedule
            </span>
          ),
          children: (
            <div style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={3}>Business Schedule</Title>
                  <Text type="secondary">
                    Manage your business hours and availability
                  </Text>
                </Col>
                
                <Col span={24}>
                  <Card>
                    {business ? (
                      <div>
                        <Title level={4} style={{ marginBottom: '20px' }}>Business Hours</Title>
                        
                        {business.businessHours ? (
                          <div>
                            {Object.entries(business.businessHours).map(([day, hours]) => {
                              const dayHours = hours as { open?: string; close?: string; closed?: boolean };
                              return (
                                <div key={day} style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  padding: '8px 0',
                                  borderBottom: '1px solid #f0f0f0'
                                }}>
                                  <Text strong>{day}:</Text>
                                  <Text>
                                    {dayHours.closed ? (
                                      <span style={{ color: '#ff4d4f' }}>Closed</span>
                                    ) : (
                                      `${dayHours.open || 'N/A'} - ${dayHours.close || 'N/A'}`
                                    )}
                                  </Text>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Text type="secondary">Business hours not configured yet.</Text>
                          </div>
                        )}
                        
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                          <Button type="primary" onClick={handleEditBusinessHours}>Update Business Hours</Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <CalendarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                        <Title level={4}>Schedule Management</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          Schedule management functionality coming soon.
                        </Text>
                        <Button>Create Availability</Button>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          ),
        }]}
      />
      <ServiceModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingService(null); // Reset editing state when closing
        }}
        onSubmit={handleSubmitService}
        loading={submitting}
        editingService={editingService}
      />
      
      {/* Business Profile Edit Modal */}
      <Modal
        title="Update Business Profile"
        open={editingBusiness}
        onCancel={handleCloseBusinessEdit}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <ProviderOnboarding 
          onComplete={() => {
            message.success('Business profile updated successfully!');
            handleCloseBusinessEdit();
            // Refresh the business profile
            const refreshProfile = async () => {
              try {
                const profile = await businessService.getBusinessProfile();
                setBusiness(profile);
              } catch (error) {
                console.error('Error refreshing business profile:', error);
              }
            };
            refreshProfile();
          }}
          userData={{
            name: user?.name || '',
            email: business?.email || '',
            phone: business?.phone || '',
          }}
          initialData={business}
        />
      </Modal>
      
      {/* Business Hours Edit Modal */}
      <Modal
        title="Update Business Hours"
        open={editingBusinessHours}
        onCancel={handleCloseBusinessHoursEdit}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <ProviderOnboarding 
          onComplete={(updatedData) => {
            message.success('Business hours updated successfully!');
            handleCloseBusinessHoursEdit();
            // Refresh the business profile to show updated hours
            const refreshProfile = async () => {
              try {
                const profile = await businessService.getBusinessProfile();
                setBusiness(profile);
              } catch (error) {
                console.error('Error refreshing business profile:', error);
                message.error('Failed to refresh business hours display');
              }
            };
            refreshProfile();
          }}
          userData={undefined}
          initialData={business}
          showOnlyBusinessHours={true}
        />
      </Modal>
    </div>
  );
}

export default ProviderDashboardContent;