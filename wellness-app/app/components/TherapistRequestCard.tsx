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
          <Space align="center">
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
            >
              Reject
            </Button>
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              size="small"
              onClick={handleApprove}
              loading={loading}
            >
              Approve
            </Button>
          </Space>
        )
      }
    >
      <div style={{ flex: 1 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
          
          {request.specialties && request.specialties.length > 0 && (
            <div>
              <Text strong>Specialties: </Text>
              <Space wrap>
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
          <Text type="secondary">
            {request.status === 'approved' 
              ? `Approved on: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}` 
              : 'Request rejected'}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default TherapistRequestCard;