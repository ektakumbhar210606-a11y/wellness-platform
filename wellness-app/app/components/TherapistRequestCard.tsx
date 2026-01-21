'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography, Avatar } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TherapistRequest {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  email: string;
  experience: number;
  expertise: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface TherapistRequestCardProps {
  request: TherapistRequest;
  onApprove: (therapistId: string) => void;
  onReject: (therapistId: string) => void;
  loading?: boolean;
}

const TherapistRequestCard: React.FC<TherapistRequestCardProps> = ({ 
  request, 
  onApprove, 
  onReject,
  loading = false 
}) => {
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

  const isActionDisabled = request.status !== 'pending';

  return (
    <Card 
      hoverable
      style={{ marginBottom: 16 }}
      actions={
        request.status === 'pending' 
          ? [
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                disabled={isActionDisabled}
                loading={loading}
                onClick={() => onApprove(request.id)}
                style={{ borderColor: '#52c41a' }}
              >
                Approve
              </Button>,
              <Button 
                danger
                icon={<CloseOutlined />}
                disabled={isActionDisabled}
                loading={loading}
                onClick={() => onReject(request.id)}
              >
                Reject
              </Button>
            ]
          : undefined
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {request.firstName} {request.lastName}
              </Title>
              <Text type="secondary">{request.email}</Text>
            </div>
          </Space>
          {getStatusTag()}
        </Space>
        
        <Space wrap>
          <Tag icon={<ClockCircleOutlined />}>
            Experience: {request.experience} years
          </Tag>
          {request.expertise.slice(0, 3).map((skill, index) => (
            <Tag key={index} color="blue">
              {skill}
            </Tag>
          ))}
          {request.expertise.length > 3 && (
            <Tag>+{request.expertise.length - 3} more</Tag>
          )}
        </Space>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Requested: {new Date(request.requestedAt).toLocaleDateString()}
        </Text>
      </Space>
    </Card>
  );
};

export default TherapistRequestCard;