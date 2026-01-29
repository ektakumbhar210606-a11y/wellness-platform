import React from 'react';
import { Card, Typography, Button, Space, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import './TherapistRequestCard.css';

const { Title, Text } = Typography;

interface TherapistRequestProps {
  request: {
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
  };
  onApprove: (therapistId: string) => void;
  onReject: (therapistId: string) => void;
  loading?: boolean;
}

const TherapistRequestCard: React.FC<TherapistRequestProps> = ({
  request,
  onApprove,
  onReject,
  loading = false
}) => {
  const handleApprove = () => {
    onApprove(request.therapistId);
  };

  const handleReject = () => {
    onReject(request.therapistId);
  };

  const getStatusTag = () => {
    switch (request.status) {
      case 'approved':
        return <Tag color="green">Approved</Tag>;
      case 'rejected':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="orange">Pending</Tag>;
    }
  };

  // Determine CSS class based on status
  const cardClassName = `therapist-request-card therapist-request-status-${request.status}`;

  return (
    <Card 
      className={cardClassName}
      style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center" size="small">
            <UserOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {request.firstName} {request.lastName}
              </Title>
              {getStatusTag()}
            </div>
          </Space>
        </div>
      }
      extra={
        request.status === 'pending' && (
          <Space>
            <Button 
              type="primary" 
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={handleReject}
              loading={loading}
              title="Reject"
            />
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              size="small"
              onClick={handleApprove}
              loading={loading}
              title="Approve"
            />
          </Space>
        )
      }
    >
      <div style={{ flex: 1 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <MailOutlined style={{ marginRight: 8, color: '#667eea' }} />
            <Text copyable={{ text: request.email }}>{request.email}</Text>
          </div>
          
          {request.phone && (
            <div>
              <PhoneOutlined style={{ marginRight: 8, color: '#667eea' }} />
              <Text copyable={{ text: request.phone }}>{request.phone}</Text>
            </div>
          )}
          
          {request.bio && (
            <div>
              <Text strong>About: </Text>
              <Text type="secondary">{request.bio.substring(0, 100)}{request.bio.length > 100 ? '...' : ''}</Text>
            </div>
          )}
          
          {request.professionalTitle && (
            <div>
              <Text strong>Title: </Text>
              <Text type="secondary">
                {typeof request.professionalTitle === 'string' 
                  ? request.professionalTitle 
                  : 'Professional title available'}
              </Text>
            </div>
          )}
          
          {request.licenseNumber && (
            <div>
              <Text strong>License: </Text>
              <Text type="secondary">
                {typeof request.licenseNumber === 'string' 
                  ? request.licenseNumber 
                  : 'License information available'}
              </Text>
            </div>
          )}
          
          {request.certifications && request.certifications.length > 0 && (
            <div>
              <Text strong>Certifications: </Text>
              <Space wrap={true}>
                {request.certifications.map((certification, index) => {
                  const certValue = typeof certification === 'string' 
                    ? certification 
                    : typeof certification === 'object' && certification !== null
                    ? JSON.stringify(certification)
                    : 'Certification';
                  return (
                    <Tag key={index} color="blue">
                      {certValue}
                    </Tag>
                  );
                })}
              </Space>
            </div>
          )}
          
          {request.location && (
            <div>
              <Text strong>Location: </Text>
              <Text type="secondary">
                {typeof request.location === 'string' 
                  ? request.location 
                  : `${request.location.city || ''} ${request.location.state || ''}`.trim() || 'N/A'}
              </Text>
            </div>
          )}
          
          {request.experience !== undefined && (
            <div>
              <Text strong>Experience: </Text>
              <Text type="secondary">{request.experience} years</Text>
            </div>
          )}
          
          {request.availability && (
            <div>
              <Text strong>Availability: </Text>
              <Text type="secondary">
                {typeof request.availability === 'string' 
                  ? request.availability 
                  : 'Availability information available'}
              </Text>
            </div>
          )}
          
          {request.skills && request.skills.length > 0 && (
            <div>
              <Text strong>Skills: </Text>
              <Space wrap={true}>
                {request.skills.map((skill, index) => (
                  <Tag key={index} color="blue">
                    {skill}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          
          {request.specialties && request.specialties.length > 0 && (
            <div>
              <Text strong>Specialties: </Text>
              <Space wrap={true}>
                {request.specialties.map((specialty, index) => (
                  <Tag key={index} color="blue">
                    {specialty}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          
          <div>
            <Text type="secondary">
              Requested: {new Date(request.requestedAt).toLocaleDateString()}
            </Text>
          </div>
        </Space>
      </div>
      
      {request.status !== 'pending' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">
              {request.status === 'approved' 
                ? `Approved on: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}` 
                : 'Request rejected'}
            </Text>
            {request.status === 'approved' && (
              <Button type="primary" size="small">
                Assign Task
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TherapistRequestCard;