'use client';

import React from 'react';
import { Card, Button, Tag, Space, Typography, Divider, Rate } from 'antd';
import { 
  ShopOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  GlobalOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { formatTimeRange } from '../utils/timeUtils';

const { Title, Text, Paragraph } = Typography;

interface CustomerBusinessCardProps {
  business: {
    _id: string | any; // ObjectId from MongoDB
    name: string;
    description?: string;
    serviceType?: string;
    serviceName?: string;
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
    createdAt: Date;
    avgRating?: number; // Average rating calculated from reviews
  };
  onViewServices: (businessId: string) => void;
  loading?: boolean;
}

const CustomerBusinessCard: React.FC<CustomerBusinessCardProps> = ({ 
  business, 
  onViewServices, 
  loading = false
}) => {

  
  return (
    <Card 
      hoverable
      className="card-responsive"
      style={{ 
        height: 300,
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
          loading={loading}
          onClick={() => onViewServices(business._id)}
          style={{ width: '100%' }}
        >
          View Services
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
              {business.serviceType && (
                <Tag color="blue">{business.serviceType.charAt(0).toUpperCase() + business.serviceType.slice(1)}</Tag>
              )}
            </Space>
          </Space>
          
          {/* Rating */}
          <div style={{ marginBottom: 8 }}>
            <Rate 
              value={business.avgRating || 0} 
              allowHalf 
              disabled 
              style={{ fontSize: '14px' }}
            />
            <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
              {(business.avgRating || 0).toFixed(1)} reviews
            </span>
          </div>
          
          {/* Business Description */}
          {business.description && (
            <Paragraph className="responsive-body" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {business.description}
            </Paragraph>
          )}
          
          {/* Service Name (if available) */}
          {business.serviceName && (
            <div style={{ marginBottom: 8 }}>
              <Text strong type="secondary" className="responsive-caption">
                Featured: {business.serviceName}
              </Text>
            </div>
          )}
          
          {/* Business Address */}
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Space>
              <EnvironmentOutlined />
              <Text className="responsive-caption" ellipsis>
                {business.address.city}, {business.address.state}
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
              {business.status === 'active' ? 'Available' : business.status}
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

export default CustomerBusinessCard;