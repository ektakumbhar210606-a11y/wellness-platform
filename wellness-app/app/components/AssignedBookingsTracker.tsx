'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Spin,
  Empty,
  Select,
  Row,
  Col,
  Statistic,
  message,
  DatePicker,
  TimePicker
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  HistoryOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface AssignedBooking {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
    userId: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  };
  date: Date;
  time: string;
  status: string;
  notes?: string;
  assignedByAdmin: boolean;
  assignedById: string;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: {
    status: string;
    timestamp: Date;
    changedBy: string;
  }[];
}

const AssignedBookingsTracker: React.FC = () => {
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTherapist, setFilterTherapist] = useState<string>('all');
  const [summary, setSummary] = useState({
    totalAssigned: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    rescheduled: 0
  });
  const [therapists, setTherapists] = useState<{id: string, name: string}[]>([]);

  const fetchAssignedBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching assigned bookings...');
      
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus);
      }
      if (filterTherapist !== 'all') {
        queryParams.append('therapistId', filterTherapist);
      }
      
      const url = `/api/business/assigned-bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      console.log('Assigned bookings API response:', response);

      if (response.success && response.data) {
        setBookings(response.data.bookings);
        setSummary(response.data.summary);
        
        // Extract unique therapists for filter dropdown
        const uniqueTherapists = Array.from(
          new Set(response.data.bookings.map((b: AssignedBooking) => b.therapist.id))
        ).map(id => {
          const booking = response.data.bookings.find((b: AssignedBooking) => b.therapist.id === id);
          return {
            id: booking?.therapist.id || '',
            name: booking?.therapist.fullName || 'Unknown Therapist'
          };
        }).filter(t => t.id);
        
        setTherapists(uniqueTherapists);
      } else {
        console.error('API Error:', response.error);
        message.error(response.error || 'Failed to fetch assigned bookings');
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error fetching assigned bookings:', error);
      message.error('Failed to fetch assigned bookings: ' + error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
      case 'confirmed':
        return <Tag color="green" icon={<CheckOutlined />}>Confirmed</Tag>;
      case 'cancelled':
        return <Tag color="red" icon={<CloseOutlined />}>Cancelled</Tag>;
      case 'rescheduled':
        return <Tag color="blue" icon={<CalendarOutlined />}>Rescheduled</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#faad14';
      case 'confirmed': return '#52c41a';
      case 'cancelled': return '#ff4d4f';
      case 'rescheduled': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
    if (filterTherapist !== 'all' && booking.therapist.id !== filterTherapist) return false;
    return true;
  });

  useEffect(() => {
    fetchAssignedBookings();
  }, [filterStatus, filterTherapist]);

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Assigned"
              value={summary.totalAssigned}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={summary.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Confirmed"
              value={summary.confirmed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={summary.cancelled}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Filter by:</Text>
          </Col>
          <Col>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="rescheduled">Rescheduled</Option>
            </Select>
          </Col>
          <Col>
            <Select
              value={filterTherapist}
              onChange={setFilterTherapist}
              style={{ width: 200 }}
              placeholder="Therapist"
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Therapists</Option>
              {therapists.map(therapist => (
                <Option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button 
              icon={<HistoryOutlined />} 
              onClick={fetchAssignedBookings}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading assigned bookings...</Text>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <Empty
            description={
              filterStatus === 'all' && filterTherapist === 'all'
                ? "No bookings have been assigned to therapists yet"
                : "No bookings match the current filters"
            }
          >
            <Button 
              type="primary" 
              onClick={fetchAssignedBookings}
              icon={<HistoryOutlined />}
            >
              Refresh Data
            </Button>
          </Empty>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              style={{ 
                width: '100%',
                borderLeft: `4px solid ${getStatusColor(booking.status)}`
              }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Space size="large" wrap>
                      {/* Customer Info */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          <UserOutlined style={{ marginRight: 8 }} />
                          {booking.customer.firstName} {booking.customer.lastName}
                        </Text>
                        <div style={{ marginLeft: 24, marginTop: 4 }}>
                          <Text type="secondary">
                            <MailOutlined style={{ marginRight: 4 }} />
                            {booking.customer.email}
                          </Text>
                          {booking.customer.phone && (
                            <div>
                              <PhoneOutlined style={{ marginRight: 4 }} />
                              <Text type="secondary">{booking.customer.phone}</Text>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Service Info */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          <ShopOutlined style={{ marginRight: 8 }} />
                          {booking.service.name}
                        </Text>
                        <div style={{ marginLeft: 24, marginTop: 4 }}>
                          <Text type="secondary">
                            <DollarCircleOutlined style={{ marginRight: 4 }} />
                            ${booking.service.price} • {booking.service.duration} mins
                          </Text>
                        </div>
                      </div>

                      {/* Therapist Info */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          <UserOutlined style={{ marginRight: 8 }} />
                          {booking.therapist.fullName}
                        </Text>
                        <div style={{ marginLeft: 24, marginTop: 4 }}>
                          <Text type="secondary">
                            {booking.therapist.professionalTitle}
                          </Text>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          <CalendarOutlined style={{ marginRight: 8 }} />
                          {dayjs(booking.date).format('MMM D, YYYY')}
                        </Text>
                        <div style={{ marginLeft: 24, marginTop: 4 }}>
                          <Text type="secondary">
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {booking.time}
                          </Text>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        {getStatusTag(booking.status)}
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Updated: {dayjs(booking.updatedAt).format('MMM D, h:mm A')}
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                      <Text strong>Notes: </Text>
                      <Text>{booking.notes}</Text>
                    </div>
                  )}

                  {/* Status History */}
                  {booking.statusHistory && booking.statusHistory.length > 1 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>
                        <HistoryOutlined style={{ marginRight: 4 }} />
                        Status History:
                      </Text>
                      <div style={{ marginTop: 8, paddingLeft: 16 }}>
                        {booking.statusHistory.map((history, index) => (
                          <div key={index} style={{ marginBottom: 4 }}>
                            <Tag color={getStatusColor(history.status)}>
                              {history.status}
                            </Tag>
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              {dayjs(history.timestamp).format('MMM D, h:mm A')} 
                              {history.changedBy !== 'system' && ` by ${history.changedBy}`}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ marginLeft: 24 }}>
                  <Space direction="vertical">
                    <Button 
                      size="small"
                      onClick={() => {
                        // Future: Implement view details functionality
                        message.info('Booking details functionality coming soon');
                      }}
                    >
                      View Details
                    </Button>
                    {booking.status === 'pending' && (
                      <Button 
                        size="small"
                        type="primary"
                        danger
                        onClick={() => {
                          // Future: Implement cancel assignment functionality
                          message.info('Cancel assignment functionality coming soon');
                        }}
                      >
                        Cancel Assignment
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedBookingsTracker;