'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  DatePicker,
  TimePicker,
  message,
  Spin,
  Empty,
  Select,
  Row,
  Col,
  Divider
} from 'antd';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';
import { isWithin24Hours } from '@/app/utils/timeUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface Booking {
  id: string;
  displayId?: string; // User-friendly display ID
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
    description: string;
  };
  business: {
    id: string;
    name: string;
    address?: {
      country: string;
    };
  } | null;
  date: Date;
  time: string;
  status: string;
  notes?: string;
  assignedByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RescheduleModalProps {
  visible: boolean;
  booking: Booking | null;
  onCancel: () => void;
  onReschedule: (newDate: Date, newTime: string) => void;
  loading: boolean;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  booking,
  onCancel,
  onReschedule,
  loading
}) => {
  const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(null);
  const [newTime, setNewTime] = useState<dayjs.Dayjs | null>(null);

  const handleReschedule = () => {
    if (!newDate || !newTime) {
      message.warning('Please select both date and time');
      return;
    }

    onReschedule(newDate.toDate(), newTime.format('HH:mm'));
    setNewDate(null);
    setNewTime(null);
  };

  const handleCancel = () => {
    onCancel();
    setNewDate(null);
    setNewTime(null);
  };

  return (
    <Modal
      title="Reschedule Booking"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="reschedule"
          type="primary"
          onClick={handleReschedule}
          loading={loading}
        >
          Reschedule
        </Button>
      ]}
    >
      {booking && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>Booking Details</Title>
          <p><strong>Customer:</strong> {booking.customer.firstName} {booking.customer.lastName}</p>
          <p><strong>Service:</strong> {booking.service.name}</p>
          <p><strong>Current Date:</strong> {dayjs(booking.date).format('MMMM D, YYYY')}</p>
          <p><strong>Current Time:</strong> {booking.time}</p>
        </div>
      )}

      <div>
        <Title level={5}>New Date & Time</Title>
        <Space vertical style={{ width: '100%' }}>
          <div>
            <Text strong>New Date:</Text>
            <DatePicker
              value={newDate}
              onChange={setNewDate}
              style={{ width: '100%', marginTop: 8 }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </div>
          <div>
            <Text strong>New Time:</Text>
            <TimePicker
              value={newTime}
              onChange={setNewTime}
              format="HH:mm"
              style={{ width: '100%', marginTop: 8 }}
              minuteStep={15}
            />
          </div>
        </Space>
      </div>
    </Modal>
  );
};

const TherapistBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching therapist bookings...');
      const response = await makeAuthenticatedRequest('/api/therapist/bookings/assigned');
      
      console.log('API Response:', response);

      if (response.success && response.data) {
        console.log('Setting bookings:', response.data.bookings);
        setBookings(response.data.bookings);
      } else {
        console.error('API Error:', response.error);
        message.error(response.error || 'Failed to fetch bookings');
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to fetch bookings: ' + error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${bookingId}/confirm`, {
        method: 'PATCH'
      });

      if (response.success) {
        message.success('Booking confirmed successfully');
        fetchBookings(); // Refresh the list
      } else {
        message.error(response.error || 'Failed to confirm booking');
      }
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      message.error('Failed to confirm booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${bookingId}/cancel`, {
        method: 'PATCH'
      });

      if (response.success) {
        message.success('Booking cancelled successfully');
        fetchBookings(); // Refresh the list
      } else {
        message.error(response.error || 'Failed to cancel booking');
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      message.error('Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (newDate: Date, newTime: string) => {
    if (!selectedBooking) return;

    try {
      setActionLoading(selectedBooking.id);
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${selectedBooking.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newDate, newTime })
      });

      if (response.success) {
        message.success('Booking rescheduled successfully');
        setRescheduleModalVisible(false);
        setSelectedBooking(null);
        fetchBookings(); // Refresh the list
      } else {
        message.error(response.error || 'Failed to reschedule booking');
      }
    } catch (error: any) {
      console.error('Error rescheduling booking:', error);
      message.error('Failed to reschedule booking');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">Pending</Tag>;
      case 'confirmed':
        return <Tag color="green">Confirmed</Tag>;
      case 'cancelled':
        return <Tag color="red">Cancelled</Tag>;
      case 'completed':
        return <Tag color="blue">Completed</Tag>;
      case 'rescheduled':
        return <Tag color="gold">Rescheduled</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === filterStatus);

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            My Bookings
          </Title>
          <Text type="secondary">
            Manage your assigned booking requests
          </Text>
        </Col>
        <Col>
          <Space>
            <Text strong>Filter by status:</Text>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Option value="all">All</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="rescheduled">Rescheduled</Option>
            </Select>
            <Button onClick={fetchBookings} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading bookings...</Text>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <Empty
            description={
              filterStatus === 'all'
                ? "No bookings assigned to you yet"
                : `No ${filterStatus} bookings found`
            }
          >
            <Button type="primary" onClick={fetchBookings}>
              Refresh
            </Button>
          </Empty>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              style={{ width: '100%' }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Space size="large">
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

                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          <ShopOutlined style={{ marginRight: 8 }} />
                          {booking.service.name}
                        </Text>
                        <div style={{ marginLeft: 24, marginTop: 4 }}>
                          <Text type="secondary">
                            <DollarCircleOutlined style={{ marginRight: 4 }} />
                            {formatCurrency(booking.service.price, booking.business?.address?.country || 'USA')} • {booking.service.duration} mins
                          </Text>
                          {booking.business && (
                            <div>
                              <Text type="secondary">Business: {booking.business.name}</Text>
                            </div>
                          )}
                        </div>
                      </div>

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

                      <div>
                        {getStatusTag(booking.status)}
                      </div>
                    </Space>
                  </div>

                  {booking.notes && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Notes: </Text>
                      <Text>{booking.notes}</Text>
                    </div>
                  )}
                </div>

                <div style={{ marginLeft: 24 }}>
                  <Space vertical>
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleConfirm(booking.id)}
                          loading={actionLoading === booking.id}
                          style={{ width: 120 }}
                        >
                          Confirm
                        </Button>
                        <Button
                          icon={<CloseOutlined />}
                          onClick={() => handleCancel(booking.id)}
                          loading={actionLoading === booking.id}
                          style={{ width: 120 }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'rescheduled') && !isWithin24Hours(booking.date, booking.time) && (
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setRescheduleModalVisible(true);
                        }}
                        loading={actionLoading === booking.id}
                        style={{ width: 120 }}
                      >
                        Reschedule
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'rescheduled') && isWithin24Hours(booking.date, booking.time) && (
                      <Button
                        disabled
                        title="Rescheduling is not allowed within 24 hours of the booking time"
                        style={{ width: 120 }}
                      >
                        Reschedule (Unavailable)
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RescheduleModal
        visible={rescheduleModalVisible}
        booking={selectedBooking}
        onCancel={() => {
          setRescheduleModalVisible(false);
          setSelectedBooking(null);
        }}
        onReschedule={handleReschedule}
        loading={actionLoading !== null}
      />
    </div>
  );
};

export default TherapistBookings;