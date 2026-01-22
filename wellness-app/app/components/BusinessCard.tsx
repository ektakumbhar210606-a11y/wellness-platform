'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography } from 'antd';
import { ShopOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface BusinessCardProps {
  business: {
    _id: string;
    name: string;
    address: {
      city: string;
      state: string;
    };
    openingTime: string;
    closingTime: string;
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
      style={{ marginBottom: 16 }}
      actions={[
        <Button 
          type="primary" 
          disabled={isJoinDisabled}
          loading={loading}
          onClick={() => onJoinRequest(business._id)}
        >
          {business.associationStatus === 'approved' 
            ? 'Already Joined' 
            : business.associationStatus === 'pending' 
              ? 'Request Pending' 
              : business.associationStatus === 'rejected'
                ? 'Request Rejected'
                : 'Request to Join'}
        </Button>
      ]}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <ShopOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              {business.name}
            </Title>
          </Space>
          {getStatusTag()}
        </Space>
        
        <Space>
          <EnvironmentOutlined />
          <Text>
            {business.address.city}, {business.address.state}
          </Text>
        </Space>
        
        <Space>
          <ClockCircleOutlined />
          <Text>
            Hours: {business.openingTime} - {business.closingTime}
          </Text>
        </Space>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Status: {business.status}
        </Text>
      </Space>
    </Card>
  );
};

export default BusinessCard;