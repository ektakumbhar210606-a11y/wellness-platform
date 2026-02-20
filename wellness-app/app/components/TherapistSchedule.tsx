'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Select,
  Row,
  Col,
  Spin,
  Empty,
  Tabs,
  List,
  Divider
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/currencyFormatter';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface BusinessResponse {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    currency: string;
  };
  business: {
    id: string;
    name: string;
  } | null;
  date: Date;
  time: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedBy: string;
  confirmedAt: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  rescheduledBy?: string;
  rescheduledAt?: Date;
  originalDate?: Date;
  originalTime?: string;
}

const TherapistSchedule: React.FC = () => {
  const [responses, setResponses] = useState<BusinessResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchBusinessResponses = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/therapist/business-responses');
      
      if (response.success && response.data) {
        setResponses(response.data);
      } else {
        console.error('API Error:', response.error);
        setResponses([]);
      }
    } catch (error: any) {
      console.error('Error fetching business responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessResponses();
  }, []);

  const getStatusTag = (status: string, cancelledBy?: string, rescheduledBy?: string) => {
    if (cancelledBy) {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Cancelled</Tag>;
    }
    if (rescheduledBy) {
      return <Tag color="blue" icon={<SyncOutlined />}>Rescheduled</Tag>;
    }
    if (status === 'confirmed') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Confirmed</Tag>;
    }
    return <Tag>{status}</Tag>;
  };

  const getStatusText = (status: string, confirmedBy?: string, cancelledBy?: string, rescheduledBy?: string) => {
    if (cancelledBy) {
      return 'cancelled this booking';
    }
    if (rescheduledBy) {
      return 'rescheduled this booking';
    }
    if (status === 'confirmed') {
      return confirmedBy ? 'confirmed by business' : 'confirmed';
    }
    return status;
  };

  const filterResponses = (statusType: string) => {
    // For confirmed tab: bookings that are currently confirmed and not cancelled or rescheduled by business
    const confirmed = responses.filter(r => 
      r.status === 'confirmed' && 
      !r.cancelledBy && 
      !r.rescheduledBy
    );
    
    // For cancelled tab: bookings that were cancelled by business
    const cancelled = responses.filter(r => r.cancelledBy);
    
    // For rescheduled tab: bookings that were rescheduled by business
    const rescheduled = responses.filter(r => r.rescheduledBy);
    
    switch (statusType) {
      case 'confirmed':
        return confirmed;
      case 'cancelled':
        return cancelled;
      case 'rescheduled':
        return rescheduled;
      default:
        return responses;
    }
  };

  const filteredResponses = filterResponses(activeTab);

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY');
  };

  const formatTime = (time: string) => {
    return dayjs(`2000-01-01T${time}`).format('h:mm A');
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Business Confirmation Responses
          </Title>
          <Text type="secondary">
            View bookings that businesses have confirmed, cancelled, or rescheduled
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={fetchBusinessResponses} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'confirmed',
            label: 'Confirmed',
            children: (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading confirmed responses...</Text>
                    </div>
                  </div>
                ) : filteredResponses.length === 0 ? (
                  <Card>
                    <Empty
                      description="No confirmed business responses found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={fetchBusinessResponses}>
                        Refresh
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <div>
                    {filteredResponses.map((response, index) => (
                      <div key={response.id} style={{ marginBottom: 16 }}>
                        <Card 
                          style={{ width: '100%' }}
                          hoverable
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: 16 }}>
                                <Space size="large" wrap>
                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <UserOutlined style={{ marginRight: 8 }} />
                                      {response.customer.firstName} {response.customer.lastName}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <MailOutlined style={{ marginRight: 4 }} />
                                        {response.customer.email}
                                      </Text>
                                      {response.customer.phone && (
                                        <div>
                                          <PhoneOutlined style={{ marginRight: 4 }} />
                                          <Text type="secondary">{response.customer.phone}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <ShopOutlined style={{ marginRight: 8 }} />
                                      {response.service.name}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        {formatCurrency(response.service.price, response.service.currency)} • {response.service.duration} mins
                                      </Text>
                                      {response.business && (
                                        <div>
                                          <Text type="secondary">Business: {response.business.name}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <CalendarOutlined style={{ marginRight: 8 }} />
                                      {formatDate(response.date)}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                        {formatTime(response.time)}
                                      </Text>
                                    </div>
                                  </div>

                                  <div>
                                    {getStatusTag(response.status, response.cancelledBy, response.rescheduledBy)}
                                  </div>
                                </Space>
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <Text strong>Action: </Text>
                                <Text>
                                  Business {getStatusText(response.status, response.confirmedBy, response.cancelledBy, response.rescheduledBy)}
                                </Text>
                                {response.confirmedAt && (
                                  <div>
                                    <Text type="secondary">Confirmed at: {dayjs(response.confirmedAt).format('MMM D, YYYY h:mm A')}</Text>
                                  </div>
                                )}
                                {response.cancelledAt && (
                                  <div>
                                    <Text type="secondary">Cancelled at: {dayjs(response.cancelledAt).format('MMM D, YYYY h:mm A')}</Text>
                                  </div>
                                )}
                                {response.rescheduledAt && (
                                  <div>
                                    <Text type="secondary">Rescheduled at: {dayjs(response.rescheduledAt).format('MMM D, YYYY h:mm A')}</Text>
                                    {response.originalDate && (
                                      <div>
                                        <Text type="secondary">
                                          Original: {formatDate(response.originalDate)} at {formatTime(response.originalTime || '')}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {response.notes && (
                                <div style={{ marginTop: 12 }}>
                                  <Text strong>Notes: </Text>
                                  <Text>{response.notes}</Text>
                                </div>
                              )}
                            </div>
                            <div style={{ marginLeft: 24 }}>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                style={{ 
                                  width: 120,
                                  backgroundColor: '#52c41a',
                                  borderColor: '#52c41a'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#389e0d';
                                  e.currentTarget.style.borderColor = '#389e0d';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#52c41a';
                                  e.currentTarget.style.borderColor = '#52c41a';
                                }}
                              >
                                Completed
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'cancelled',
            label: 'Cancelled',
            children: (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading cancelled responses...</Text>
                    </div>
                  </div>
                ) : filteredResponses.length === 0 ? (
                  <Card>
                    <Empty
                      description="No cancelled business responses found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={fetchBusinessResponses}>
                        Refresh
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <div>
                    {filteredResponses.map((response, index) => (
                      <div key={response.id} style={{ marginBottom: 16 }}>
                        <Card 
                          style={{ width: '100%' }}
                          hoverable
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: 16 }}>
                                <Space size="large" wrap>
                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <UserOutlined style={{ marginRight: 8 }} />
                                      {response.customer.firstName} {response.customer.lastName}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <MailOutlined style={{ marginRight: 4 }} />
                                        {response.customer.email}
                                      </Text>
                                      {response.customer.phone && (
                                        <div>
                                          <PhoneOutlined style={{ marginRight: 4 }} />
                                          <Text type="secondary">{response.customer.phone}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <ShopOutlined style={{ marginRight: 8 }} />
                                      {response.service.name}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        {formatCurrency(response.service.price, response.service.currency)} • {response.service.duration} mins
                                      </Text>
                                      {response.business && (
                                        <div>
                                          <Text type="secondary">Business: {response.business.name}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <CalendarOutlined style={{ marginRight: 8 }} />
                                      {formatDate(response.date)}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                        {formatTime(response.time)}
                                      </Text>
                                    </div>
                                  </div>

                                  <div>
                                    {getStatusTag(response.status, response.cancelledBy, response.rescheduledBy)}
                                  </div>
                                </Space>
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <Text strong>Action: </Text>
                                <Text>
                                  Business {getStatusText(response.status, response.confirmedBy, response.cancelledBy, response.rescheduledBy)}
                                </Text>
                                {response.cancelledAt && (
                                  <div>
                                    <Text type="secondary">Cancelled at: {dayjs(response.cancelledAt).format('MMM D, YYYY h:mm A')}</Text>
                                  </div>
                                )}
                              </div>

                              {response.notes && (
                                <div style={{ marginTop: 12 }}>
                                  <Text strong>Notes: </Text>
                                  <Text>{response.notes}</Text>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'rescheduled',
            label: 'Rescheduled',
            children: (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading rescheduled responses...</Text>
                    </div>
                  </div>
                ) : filteredResponses.length === 0 ? (
                  <Card>
                    <Empty
                      description="No rescheduled business responses found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" onClick={fetchBusinessResponses}>
                        Refresh
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <div>
                    {filteredResponses.map((response, index) => (
                      <div key={response.id} style={{ marginBottom: 16 }}>
                        <Card 
                          style={{ width: '100%' }}
                          hoverable
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: 16 }}>
                                <Space size="large" wrap>
                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <UserOutlined style={{ marginRight: 8 }} />
                                      {response.customer.firstName} {response.customer.lastName}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <MailOutlined style={{ marginRight: 4 }} />
                                        {response.customer.email}
                                      </Text>
                                      {response.customer.phone && (
                                        <div>
                                          <PhoneOutlined style={{ marginRight: 4 }} />
                                          <Text type="secondary">{response.customer.phone}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <ShopOutlined style={{ marginRight: 8 }} />
                                      {response.service.name}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        {formatCurrency(response.service.price, response.service.currency)} • {response.service.duration} mins
                                      </Text>
                                      {response.business && (
                                        <div>
                                          <Text type="secondary">Business: {response.business.name}</Text>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Text strong style={{ fontSize: 16 }}>
                                      <CalendarOutlined style={{ marginRight: 8 }} />
                                      {formatDate(response.date)}
                                    </Text>
                                    <div style={{ marginLeft: 24, marginTop: 4 }}>
                                      <Text type="secondary">
                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                        {formatTime(response.time)}
                                      </Text>
                                    </div>
                                  </div>

                                  <div>
                                    {getStatusTag(response.status, response.cancelledBy, response.rescheduledBy)}
                                  </div>
                                </Space>
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <Text strong>Action: </Text>
                                <Text>
                                  Business {getStatusText(response.status, response.confirmedBy, response.cancelledBy, response.rescheduledBy)}
                                </Text>
                                {response.rescheduledAt && (
                                  <div>
                                    <Text type="secondary">Rescheduled at: {dayjs(response.rescheduledAt).format('MMM D, YYYY h:mm A')}</Text>
                                    {response.originalDate && (
                                      <div>
                                        <Text type="secondary">
                                          Original: {formatDate(response.originalDate)} at {formatTime(response.originalTime || '')}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {response.notes && (
                                <div style={{ marginTop: 12 }}>
                                  <Text strong>Notes: </Text>
                                  <Text>{response.notes}</Text>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default TherapistSchedule;