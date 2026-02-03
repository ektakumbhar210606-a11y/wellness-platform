'use client';

import React, { useState } from 'react';
import { Tabs, Card, Typography, Spin, Empty, Row, Col, message } from 'antd';
import { TeamOutlined, HistoryOutlined } from '@ant-design/icons';
import TherapistRequestCard from '@/app/components/TherapistRequestCard';
import AssignedBookingsTracker from '@/app/components/AssignedBookingsTracker';

const { Title, Text } = Typography;

interface TherapistRequest {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  professionalTitle?: string | object;
  certifications?: string[] | object[];
  licenseNumber?: string | object;
  location?: string | { city?: string; state?: string; country?: string; };
  availability?: string | object;
  experience?: number;
  skills?: string[];
  areaOfExpertise?: string[];
}

interface TherapistRequestsAndResponsesProps {
  requests: TherapistRequest[];
  requestsLoading: boolean;
  requestActionLoading: string | null;
  onApproveRequest: (therapistId: string) => void;
  onRejectRequest: (therapistId: string) => void;
  onAssignTask: (therapistId: string, bookingId: string) => void;
  dashboardStats?: any;
}

const TherapistRequestsAndResponses: React.FC<TherapistRequestsAndResponsesProps> = ({
  requests,
  requestsLoading,
  requestActionLoading,
  onApproveRequest,
  onRejectRequest,
  onAssignTask,
  dashboardStats
}) => {
  const [activeTab, setActiveTab] = useState('requests');

  const handleApproveRequest = (therapistId: string) => {
    onApproveRequest(therapistId);
  };

  const handleRejectRequest = (therapistId: string) => {
    onRejectRequest(therapistId);
  };

  const handleAssignTask = (therapistId: string, bookingId: string) => {
    onAssignTask(therapistId, bookingId);
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'applications',
            label: (
              <span>
                <TeamOutlined />
                Therapist Applications
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
                                onAssignTask={handleAssignTask}
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
            )
          },
          {
            key: 'responses',
            label: (
              <span>
                <HistoryOutlined />
                Booking Responses
                {(dashboardStats?.totalServices || 0) > 0 && (
                  <span style={{ 
                    marginLeft: 8, 
                    backgroundColor: '#1890ff', 
                    color: 'white', 
                    borderRadius: '50%', 
                    padding: '2px 6px', 
                    fontSize: '12px' 
                  }}>
                    New
                  </span>
                )}
              </span>
            ),
            children: (
              <div style={{ marginTop: 16 }}>
                <AssignedBookingsTracker />
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default TherapistRequestsAndResponses;