'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography, Divider } from 'antd';
import { ShopOutlined, EnvironmentOutlined, ClockCircleOutlined, PhoneOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import { formatTimeRange } from '../utils/timeUtils';
import { formatAddress } from '../utils/addressUtils';

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
      style={{ 
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 16 
      }}
      styles={{
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }
      }}
      actions={[
        <Button 
          type="primary" 
          disabled={isJoinDisabled}
          loading={loading}
          onClick={() => onJoinRequest(business._id)}
          style={{ width: '100%' }}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space>
                <ShopOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                <Title level={4} className="responsive-h4" style={{ margin: 0 }} ellipsis>
                  {business.name}
                </Title>
              </Space>
              {getStatusTag()}
            </Space>
          </Space>
          
          {/* Business Description */}
          {business.description && (
            <Paragraph className="responsive-body" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {business.description}
            </Paragraph>
          )}
          
          {/* Business Address */}
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Space>
              <EnvironmentOutlined />
              <Text className="responsive-caption" ellipsis>
                {formatAddress(business.address, true)}
              </Text>
            </Space>
          </Space>
          
          {/* Contact Information */}
          <Space wrap orientation="vertical" style={{ width: '100%' }}>
            {business.phone && (
              <Space>
                <PhoneOutlined />
                <Text className="responsive-caption" ellipsis>{business.phone}</Text>
              </Space>
            )}
            {business.email && (
              <Space>
                <MailOutlined />
                <Text className="responsive-caption" ellipsis>{business.email}</Text>
              </Space>
            )}
            {business.website && (
              <Space>
                <GlobalOutlined />
                <Text className="responsive-caption" ellipsis>
                  <a href={business.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                    {business.website.replace(/^https?:\/\//, '')}
                  </a>
                </Text>
              </Space>
            )}
          </Space>
          
          {/* Business Hours */}
          <Space orientation="vertical" style={{ width: '100%' }} className="responsive-caption">
            <Space>
              <ClockCircleOutlined />
              <Text className="responsive-caption" ellipsis>
                Hours: {formatTimeRange(business.openingTime, business.closingTime)}
              </Text>
            </Space>
          </Space>
        </div>
        
        <div>
          <Divider style={{ margin: '8px 0' }} />
          
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} className="responsive-caption">
            <Text type="secondary" className="responsive-caption" ellipsis>
              Status: {business.status}
            </Text>
            <Text type="secondary" className="responsive-caption" ellipsis>
              ID: {business._id.substring(0, 8)}...
            </Text>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default BusinessCard;