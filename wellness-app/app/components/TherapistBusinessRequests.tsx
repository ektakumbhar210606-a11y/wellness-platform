'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Space, Button, Spin, Alert, Tabs } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ShopOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface BusinessRequest {
  id: string;
  businessId: string;
  businessName: string;
  businessAddress: string;
  businessDescription?: string;
  businessStatus: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  businessContact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

const TherapistBusinessRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchBusinessRequests = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/therapist/business-requests');
      
      if (response.success && response.data) {
        setRequests(response.data.allRequests);
        setCounts(response.data.counts);
      }
    } catch (error: any) {
      console.error('Error fetching business requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessRequests();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchBusinessRequests();
      setLastRefresh(new Date());
    }, 30000); // Poll every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="green">Approved</Tag>;
      case 'rejected':
        return <Tag icon={<CloseCircleOutlined />} color="red">Rejected</Tag>;
      default:
        return <Tag icon={<ClockCircleOutlined />} color="orange">Pending</Tag>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#f6ffed';
      case 'rejected': return '#fff2f0';
      default: return '#fffbe6';
    }
  };

  const groupRequestsByStatus = () => {
    return {
      pending: requests.filter(r => r.status === 'pending'),
      approved: requests.filter(r => r.status === 'approved'),
      rejected: requests.filter(r => r.status === 'rejected')
    };
  };

  const groupedRequests = groupRequestsByStatus();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading business requests...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>My Business Requests</Title>
        <Text type="secondary">
          Track the status of your requests to join businesses
        </Text>
        
        {/* Summary Cards */}
        <div style={{ marginTop: 16 }}>
          <Space size="middle">
            <Card size="small" style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Space>
                <ClockCircleOutlined style={{ color: '#faad14' }} />
                <span>Pending: <strong>{counts.pending}</strong></span>
              </Space>
            </Card>
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>Approved: <strong>{counts.approved}</strong></span>
              </Space>
            </Card>
            <Card size="small" style={{ backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}>
              <Space>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                <span>Rejected: <strong>{counts.rejected}</strong></span>
              </Space>
            </Card>
          </Space>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={fetchBusinessRequests}
            style={{ marginLeft: 16 }}
          >
            Refresh Status
          </Button>
          <Text type="secondary" style={{ marginLeft: 16, fontSize: '12px' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Text>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ShopOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <Title level={4}>No Business Requests</Title>
            <Text type="secondary">
              You haven't sent any requests to join businesses yet.
              Browse available businesses and send join requests to expand your practice opportunities.
            </Text>
          </div>
        </Card>
      ) : (
        <Tabs defaultActiveKey="all">
          <TabPane tab={`All Requests (${requests.length})`} key="all">
            <List
              dataSource={requests}
              renderItem={(request) => (
                <List.Item>
                  <Card 
                    style={{ 
                      width: '100%', 
                      backgroundColor: getStatusColor(request.status),
                      borderLeft: `4px solid ${
                        request.status === 'approved' ? '#52c41a' : 
                        request.status === 'rejected' ? '#ff4d4f' : '#faad14'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Title level={4} style={{ margin: '0 0 8px 0' }}>
                          {request.businessName}
                        </Title>
                        
                        <Space orientation="vertical" size="small">
                          <Text type="secondary">
                            <ShopOutlined /> {request.businessAddress}
                          </Text>
                          
                          {request.businessDescription && (
                            <Text type="secondary">
                              {request.businessDescription.substring(0, 100)}
                              {request.businessDescription.length > 100 ? '...' : ''}
                            </Text>
                          )}
                          
                          <Space size="middle">
                            <Text type="secondary">
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </Text>
                            
                            {request.approvedAt && (
                              <Text type="secondary">
                                Approved: {new Date(request.approvedAt).toLocaleDateString()}
                              </Text>
                            )}
                          </Space>
                        </Space>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        {getStatusTag(request.status)}
                        {request.businessContact?.email && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Contact: {request.businessContact.email}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </TabPane>
          
          <TabPane tab={`Pending (${groupedRequests.pending.length})`} key="pending">
            {groupedRequests.pending.length > 0 ? (
              <List
                dataSource={groupedRequests.pending}
                renderItem={(request) => (
                  <List.Item>
                    <Card style={{ width: '100%', backgroundColor: '#fffbe6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Title level={4} style={{ margin: '0 0 8px 0' }}>
                            {request.businessName}
                          </Title>
                          <Text type="secondary">{request.businessAddress}</Text>
                        </div>
                        <div>
                          <Tag icon={<ClockCircleOutlined />} color="orange">
                            Pending Approval
                          </Tag>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <ClockCircleOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
                  <Text type="secondary">No pending requests</Text>
                </div>
              </Card>
            )}
          </TabPane>
          
          <TabPane tab={`Approved (${groupedRequests.approved.length})`} key="approved">
            {groupedRequests.approved.length > 0 ? (
              <List
                dataSource={groupedRequests.approved}
                renderItem={(request) => (
                  <List.Item>
                    <Card style={{ width: '100%', backgroundColor: '#f6ffed' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Title level={4} style={{ margin: '0 0 8px 0' }}>
                            {request.businessName}
                          </Title>
                          <Text type="secondary">{request.businessAddress}</Text>
                        </div>
                        <div>
                          <Tag icon={<CheckCircleOutlined />} color="green">
                            Approved
                          </Tag>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Approved: {new Date(request.approvedAt!).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <CheckCircleOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
                  <Text type="secondary">No approved requests</Text>
                </div>
              </Card>
            )}
          </TabPane>
          
          <TabPane tab={`Rejected (${groupedRequests.rejected.length})`} key="rejected">
            {groupedRequests.rejected.length > 0 ? (
              <List
                dataSource={groupedRequests.rejected}
                renderItem={(request) => (
                  <List.Item>
                    <Card style={{ width: '100%', backgroundColor: '#fff2f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Title level={4} style={{ margin: '0 0 8px 0' }}>
                            {request.businessName}
                          </Title>
                          <Text type="secondary">{request.businessAddress}</Text>
                        </div>
                        <div>
                          <Tag icon={<CloseCircleOutlined />} color="red">
                            Rejected
                          </Tag>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Requested: {new Date(request.requestedAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <CloseCircleOutlined style={{ fontSize: '32px', color: '#ccc', marginBottom: 8 }} />
                  <Text type="secondary">No rejected requests</Text>
                </div>
              </Card>
            )}
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default TherapistBusinessRequests;