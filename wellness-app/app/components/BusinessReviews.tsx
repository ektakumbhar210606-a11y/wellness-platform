'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Space, 
  Spin, 
  Alert,
  Select,
  Row,
  Col,
  Button
} from 'antd';
import { StarOutlined, UserOutlined, CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { makeAuthenticatedRequest } from '../utils/apiUtils';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

interface Review {
  therapistName: string;
  customerName: string;
  serviceName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

interface TherapistOption {
  value: string;
  label: string;
}

const BusinessReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [therapists, setTherapists] = useState<TherapistOption[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch therapists for dropdown filter
  useEffect(() => {
    console.log('BusinessReviews component mounted');
    fetchTherapists();
  }, []);

  // Fetch reviews when component mounts or therapist filter changes
  useEffect(() => {
    console.log('Fetching reviews, selectedTherapist:', selectedTherapist);
    fetchReviews();
  }, [selectedTherapist]);

  const fetchTherapists = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/business/therapists');
      
      if (response.success && response.data) {
        const approvedTherapists = response.data.approvedTherapists || [];
        const therapistOptions = approvedTherapists.map((therapist: any) => ({
          value: therapist.id,
          label: therapist.fullName || `${therapist.firstName} ${therapist.lastName}`.trim() || 'Unknown Therapist'
        }));
        
        // Add "All Therapists" option
        setTherapists([
          { value: '', label: 'All Therapists' },
          ...therapistOptions
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching therapists:', err);
      // Continue without therapists list - reviews will still work
    }
  };

  const fetchReviews = async () => {
    try {
      setTableLoading(true);
      setError(null);
      
      const url = selectedTherapist 
        ? `/api/business/reviews?therapistId=${selectedTherapist}`
        : '/api/business/reviews';
      
      const response = await makeAuthenticatedRequest(url);
      
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
      } else {
        setError(response.error || 'Failed to fetch reviews');
        setReviews([]);
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews');
      setReviews([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleTherapistChange = (value: string) => {
    setSelectedTherapist(value);
  };

  const handleRefresh = () => {
    fetchReviews();
  };

  // Define table columns
  const columns: ColumnsType<Review> = [
    {
      title: 'Therapist',
      dataIndex: 'therapistName',
      key: 'therapistName',
      sorter: (a, b) => a.therapistName.localeCompare(b.therapistName),
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName',
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a, b) => a.rating - b.rating,
      render: (rating: number) => (
        <Space>
          <div style={{ color: '#faad14' }}>
            {'★'.repeat(rating)}
            {'☆'.repeat(5 - rating)}
          </div>
          <Text type="secondary">({rating}/5)</Text>
        </Space>
      ),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => (
        text ? (
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
            "{text}"
          </Text>
        ) : (
          <Text type="secondary">No comment</Text>
        )
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: Date) => (
        <Text>
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading reviews...</Text>
        </div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <Card>
        <Alert
          title="Error Loading Reviews"
          description={error}
          type="error"
          showIcon
          action={
            <Button 
              type="primary" 
              onClick={fetchReviews}
              icon={<ReloadOutlined />}
            >
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px', color: '#1d3557' }}>
        Reviews
      </Title>
      
      {/* Filter Section */}
      <Card 
        style={{ 
          marginBottom: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Filter by Therapist:
              </Text>
              <Select
                value={selectedTherapist}
                onChange={handleTherapistChange}
                style={{ width: '100%' }}
                placeholder="Select a therapist"
                allowClear
              >
                {therapists.map(therapist => (
                  <Option key={therapist.value} value={therapist.value}>
                    {therapist.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Total Reviews:
              </Text>
              <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {reviews.length}
              </Text>
            </div>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <div style={{ textAlign: 'right' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={tableLoading}
              >
                Refresh
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Reviews Table */}
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <Table
          dataSource={reviews}
          columns={columns}
          rowKey={(record) => record.createdAt?.toString() || Math.random().toString()}
          loading={tableLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reviews`,
            placement: ['bottomCenter'],
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <StarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
                <Title level={4} style={{ marginBottom: '12px' }}>
                  {selectedTherapist ? 'No Reviews Found' : 'No Reviews Yet'}
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {selectedTherapist 
                    ? 'No reviews found for the selected therapist.'
                    : 'No reviews available for your therapists yet.'
                  }
                </Text>
              </div>
            )
          }}
          scroll={{ x: 768 }} // Enable horizontal scroll on small screens
        />
      </Card>

      {/* Error Alert (if there are reviews but error occurred) */}
      {error && reviews.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Alert
            title="Note"
            description={error}
            type="warning"
            showIcon
          />
        </div>
      )}
    </div>
  );
};

export default BusinessReviews;