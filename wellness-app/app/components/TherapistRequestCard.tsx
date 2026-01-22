'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography, Avatar, Collapse, Divider } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, IdcardOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface TherapistRequest {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  experience: number;
  expertise: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  
  // Extended profile information
  fullName?: string;
  professionalTitle?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  certifications?: string[];
  licenseNumber?: string;
  weeklyAvailability?: Array<{
    day: string;
    available: boolean;
    startTime?: string;
    endTime?: string;
  }>;
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
                onClick={() => onApprove(request.therapistId)}
                style={{ borderColor: '#52c41a' }}
              >
                Approve
              </Button>,
              <Button 
                danger
                icon={<CloseOutlined />}
                disabled={isActionDisabled}
                loading={loading}
                onClick={() => onReject(request.therapistId)}
              >
                Reject
              </Button>
            ]
          : undefined
      }
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        {/* Basic Info */}
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {request.fullName || `${request.firstName} ${request.lastName}`}
              </Title>
              {request.professionalTitle && (
                <Text type="secondary">{request.professionalTitle}</Text>
              )}
            </div>
          </Space>
          {getStatusTag()}
        </Space>

        {/* Contact Information */}
        <Space wrap size="middle">
          <Text type="secondary">
            <MailOutlined /> {request.email}
          </Text>
          {request.phone && (
            <Text type="secondary">
              <PhoneOutlined /> {request.phone}
            </Text>
          )}
          {request.location?.city && (
            <Text type="secondary">
              <EnvironmentOutlined /> {request.location.city}{request.location.state ? `, ${request.location.state}` : ''}
            </Text>
          )}
        </Space>

        {/* Professional Details */}
        <Space wrap>
          <Tag icon={<ClockCircleOutlined />} color="blue">
            {request.experience} years experience
          </Tag>
          {request.licenseNumber && (
            <Tag icon={<IdcardOutlined />} color="green">
              License: {request.licenseNumber}
            </Tag>
          )}
          {request.expertise.slice(0, 3).map((skill, index) => (
            <Tag key={index} color="purple">
              {skill}
            </Tag>
          ))}
          {request.expertise.length > 3 && (
            <Tag>+{request.expertise.length - 3} more specialties</Tag>
          )}
        </Space>

        {/* Expandable Detailed Information */}
        <Collapse 
          bordered={false} 
          size="small" 
          style={{ marginTop: 12 }}
          items={[{
            key: '1',
            label: 'View Full Profile',
            children: (
              <>
                {/* Bio */}
                {request.bio && (
                  <>
                    <Divider style={{ margin: '12px 0' }}>Professional Bio</Divider>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                      {request.bio}
                    </Paragraph>
                  </>
                )}
                
                {/* Certifications */}
                {request.certifications && request.certifications.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }}>Certifications</Divider>
                    <Space wrap>
                      {request.certifications.map((cert, index) => (
                        <Tag key={index} color="cyan">{cert}</Tag>
                      ))}
                    </Space>
                  </>
                )}
                
                {/* Availability */}
                {request.weeklyAvailability && request.weeklyAvailability.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }}>Weekly Availability</Divider>
                    <Space orientation="vertical" size="small">
                      {request.weeklyAvailability
                        .filter(day => day.available)
                        .map((day, index) => (
                          <Text key={index} type="secondary">
                            <CalendarOutlined /> {day.day}: {day.startTime} - {day.endTime}
                          </Text>
                        ))
                      }
                    </Space>
                  </>
                )}
                
                {/* Dates */}
                <Divider style={{ margin: '12px 0' }}>Request Timeline</Divider>
                <Space orientation="vertical" size="small">
                  <Text type="secondary">
                    Requested: {new Date(request.requestedAt).toLocaleString()}
                  </Text>
                  {request.approvedAt && (
                    <Text type="secondary">
                      Approved: {new Date(request.approvedAt).toLocaleString()}
                    </Text>
                  )}
                </Space>
              </>
            )
          }]}
        />
      </Space>
    </Card>
  );
};

export default TherapistRequestCard;