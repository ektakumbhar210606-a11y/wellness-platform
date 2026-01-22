'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography, Divider } from 'antd';
import { ShopOutlined, EnvironmentOutlined, ClockCircleOutlined, PhoneOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface BusinessCardProps {
  business: {
    _id: string;
    name: string;
    description?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phone?: string;
    email?: string;
    website?: string;
    openingTime: string;
    closingTime: string;
    businessHours?: any;
    status: string;
    associationStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  };
  onJoinRequest: (businessId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onJoinRequest, 
  loading = false,
  disabled = false
}) => {
  const getStatusTag = () => {
    switch (business.associationStatus) {
      case 'approved':
        return <Tag color="green">Approved</Tag>;
      case 'pending':
        return <Tag color="orange">Pending</Tag>;
      case 'rejected':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="blue">Available</Tag>;
    }
  };

  const isJoinDisabled = disabled || business.associationStatus === 'pending' || business.associationStatus === 'approved' || business.associationStatus === 'rejected';

  return (
    <Card 
      hoverable
      className="card-responsive"
      style={{ marginBottom: 16 }}
      actions={[
        <Button 
          type="primary" 
          disabled={isJoinDisabled}
          loading={loading}
          onClick={() => onJoinRequest(business._id)}
        >
          {(() => {
            switch (business.associationStatus) {
              case 'approved':
                return 'Already Joined';
              case 'pending':
                return 'Request Pending';
              case 'rejected':
                return 'Request Rejected';
              default:
                return 'Request to Join';
            }
          })()}
        </Button>
      ]}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Space>
              <ShopOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <Title level={4} className="responsive-h4" style={{ margin: 0 }}>
                {business.name}
              </Title>
            </Space>
            {getStatusTag()}
          </Space>
        </Space>
        
        {/* Business Description */}
        {business.description && (
          <Paragraph className="responsive-body" ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ marginBottom: 8 }}>
            {business.description}
          </Paragraph>
        )}
        
        {/* Business Address */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <EnvironmentOutlined />
            <Text className="responsive-caption">
              {business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}, {business.address.country}
            </Text>
          </Space>
        </Space>
        
        {/* Contact Information */}
        <Space wrap direction="vertical" style={{ width: '100%' }}>
          {business.phone && (
            <Space>
              <PhoneOutlined />
              <Text className="responsive-caption">{business.phone}</Text>
            </Space>
          )}
          {business.email && (
            <Space>
              <MailOutlined />
              <Text className="responsive-caption">{business.email}</Text>
            </Space>
          )}
          {business.website && (
            <Space>
              <GlobalOutlined />
              <Text className="responsive-caption">
                <a href={business.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </Text>
            </Space>
          )}
        </Space>
        
        {/* Business Hours */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <ClockCircleOutlined />
            <Text className="responsive-caption">
              Hours: {business.openingTime} - {business.closingTime}
            </Text>
          </Space>
        </Space>
        
        <Divider style={{ margin: '8px 0' }} />
        
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} className="responsive-caption">
          <Text type="secondary" className="responsive-caption">
            Status: {business.status}
          </Text>
          <Text type="secondary" className="responsive-caption">
            ID: {business._id.substring(0, 8)}...
          </Text>
        </Space>
      </Space>
    </Card>
  );
};

export default BusinessCard;