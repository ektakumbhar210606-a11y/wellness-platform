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
  Divider,
  notification,
  Modal,
  DatePicker,
  TimePicker,
  message
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
  CheckOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/currencyFormatter';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';

const { Title, Text } = Typography;
const { Option } = Select;

// Predefined cancel reasons
const CANCEL_REASONS = [
  'Personal emergency / Unavailable',
  'Double booked / Scheduling conflict',
  'Customer no-show (pre-emptive)',
  'Equipment not available'
];

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
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
  
  // New state for cancel and reschedule functionality
  const [selectedBooking, setSelectedBooking] = useState<BusinessResponse | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [cancelReasonModalVisible, setCancelReasonModalVisible] = useState(false); // New modal for cancel reason
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<dayjs.Dayjs | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<dayjs.Dayjs | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(''); // Selected cancel reason

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

  const handleMarkAsCompleted = async (bookingId: string) => {
    try {
      setLoadingBookingId(bookingId);
      
      // Call the API to mark the booking as completed
      const response = await makeAuthenticatedRequest(`/api/therapist/mark-completed`, {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      
      if (response.success) {
        // Show success message
        notification.success({
          message: 'Success',
          description: 'Booking marked as completed successfully!',
        });
        
        // Refresh the booking list to reflect the updated status
        await fetchBusinessResponses();
      } else {
        // Show error message
        notification.error({
          message: 'Error',
          description: response.error || 'Failed to mark booking as completed',
        });
      }
    } catch (error: any) {
      console.error('Error marking booking as completed:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setLoadingBookingId(null);
    }
  };

  // New handler for therapist cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setActionLoading(true);
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${selectedBooking.id}/cancel`, {
        method: 'PATCH'
      });
      
      if (response.success) {
        message.success('Booking cancelled successfully. Auto-refund of 50% advance will be processed.');
        setCancelConfirmVisible(false);
        setSelectedBooking(null);
        await fetchBusinessResponses();
      } else {
        message.error(response.error || 'Failed to cancel booking');
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      message.error('Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  // New handler for reschedule
  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      message.warning('Please select both date and time');
      return;
    }
    
    try {
      setActionLoading(true);
      const newDate = rescheduleDate.toDate();
      const newTime = rescheduleTime.format('HH:mm');
      
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${selectedBooking.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newDate, newTime })
      });
      
      if (response.success) {
        message.success('Booking rescheduled successfully');
        setRescheduleModalVisible(false);
        setSelectedBooking(null);
        setRescheduleDate(null);
        setRescheduleTime(null);
        await fetchBusinessResponses();
      } else {
        message.error(response.error || 'Failed to reschedule booking');
      }
    } catch (error: any) {
      console.error('Error rescheduling booking:', error);
      message.error('Failed to reschedule booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to open reschedule modal
  const openRescheduleModal = (booking: BusinessResponse) => {
    setSelectedBooking(booking);
    setRescheduleDate(null);
    setRescheduleTime(null);
    setRescheduleModalVisible(true);
  };

  // Helper to open cancel reason modal (NEW - replaces direct cancel confirmation)
  const openCancelReasonModal = (booking: BusinessResponse) => {
    setSelectedBooking(booking);
    setSelectedCancelReason('');
    setCancelReasonModalVisible(true);
  };

  // New handler for submitting cancel request to business
  const handleSubmitCancelRequest = async () => {
    if (!selectedBooking || !selectedCancelReason) {
      message.warning('Please select a cancellation reason');
      return;
    }
    
    try {
      setActionLoading(true);
      // Call NEW API endpoint for therapist cancel request
      const response = await makeAuthenticatedRequest(`/api/therapist/bookings/${selectedBooking.id}/cancel-request`, {
        method: 'PATCH',
        body: JSON.stringify({ cancelReason: selectedCancelReason })
      });
      
      if (response.success) {
        message.success('Cancellation request sent to business. Awaiting approval.');
        setCancelReasonModalVisible(false);
        setSelectedBooking(null);
        setSelectedCancelReason('');
        await fetchBusinessResponses();
      } else {
        message.error(response.error || 'Failed to submit cancellation request');
      }
    } catch (error: any) {
      console.error('Error submitting cancellation request:', error);
      message.error('Failed to submit cancellation request');
    } finally {
      setActionLoading(false);
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
                              <Space orientation="vertical" size="small">
                                <Button
                                  type="primary"
                                  icon={<CheckOutlined />}
                                  style={{ 
                                    width: 120,
                                    backgroundColor: '#52c41a',
                                    borderColor: '#52c41a'
                                  }}
                                  onClick={() => handleMarkAsCompleted(response.id)}
                                  loading={loadingBookingId === response.id}
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
                                <Button
                                  icon={<SyncOutlined />}
                                  onClick={() => openRescheduleModal(response)}
                                  disabled={actionLoading}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  danger
                                  icon={<StopOutlined />}
                                  onClick={() => openCancelReasonModal(response)}
                                  disabled={actionLoading}
                                >
                                  Cancel & Refund
                                </Button>
                              </Space>
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
      
      {/* Cancel Reason Modal - NEW */}
      <Modal
        title="Request Cancellation & Refund"
        open={cancelReasonModalVisible}
        onCancel={() => {
          setCancelReasonModalVisible(false);
          setSelectedBooking(null);
          setSelectedCancelReason('');
        }}
        footer={[
          <Button key="back" onClick={() => {
            setCancelReasonModalVisible(false);
            setSelectedBooking(null);
            setSelectedCancelReason('');
          }}>
            Back
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={handleSubmitCancelRequest}
            loading={actionLoading}
            disabled={!selectedCancelReason}
          >
            Send Request to Business
          </Button>
        ]}
      >
        {selectedBooking && (
          <div>
            <Title level={5}>Booking Details</Title>
            <p><strong>Customer:</strong> {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</p>
            <p><strong>Service:</strong> {selectedBooking.service.name}</p>
            <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
            <p><strong>Time:</strong> {formatTime(selectedBooking.time)}</p>
            
            <Divider />
            
            <Title level={5}>Select Cancellation Reason</Title>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Please select the reason for cancellation. This will be sent to the business for approval.
            </p>
            
            <Space orientation="vertical" style={{ width: '100%' }} size="small">
              {CANCEL_REASONS.map((reason) => (
                <div
                  key={reason}
                  onClick={() => setSelectedCancelReason(reason)}
                  style={{
                    padding: '12px 16px',
                    border: `2px solid ${selectedCancelReason === reason ? '#d32f2f' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedCancelReason === reason ? '#fff0f0' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <Space align="start">
                    <input
                      type="radio"
                      checked={selectedCancelReason === reason}
                      onChange={() => setSelectedCancelReason(reason)}
                      style={{ marginTop: '4px' }}
                    />
                    <Text>{reason}</Text>
                  </Space>
                </div>
              ))}
            </Space>
            
            <div style={{ marginTop: 20, padding: '12px', backgroundColor: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ℹ️ The business will review your request and either approve (triggering 50% refund to customer) or reject it. You will be notified of their decision.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Booking"
        open={rescheduleModalVisible}
        onCancel={() => {
          setRescheduleModalVisible(false);
          setSelectedBooking(null);
          setRescheduleDate(null);
          setRescheduleTime(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setRescheduleModalVisible(false);
            setSelectedBooking(null);
            setRescheduleDate(null);
            setRescheduleTime(null);
          }}>
            Cancel
          </Button>,
          <Button
            key="reschedule"
            type="primary"
            onClick={handleRescheduleBooking}
            loading={actionLoading}
          >
            Reschedule
          </Button>
        ]}
      >
        {selectedBooking && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Booking Details</Title>
            <p><strong>Customer:</strong> {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</p>
            <p><strong>Service:</strong> {selectedBooking.service.name}</p>
            <p><strong>Current Date:</strong> {formatDate(selectedBooking.date)}</p>
            <p><strong>Current Time:</strong> {formatTime(selectedBooking.time)}</p>
          </div>
        )}

        <div>
          <Title level={5}>New Date & Time</Title>
          <Space vertical style={{ width: '100%' }}>
            <div>
              <Text strong>New Date:</Text>
              <DatePicker
                value={rescheduleDate}
                onChange={setRescheduleDate}
                style={{ width: '100%', marginTop: 8 }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </div>
            <div>
              <Text strong>New Time:</Text>
              <TimePicker
                value={rescheduleTime}
                onChange={setRescheduleTime}
                format="HH:mm"
                style={{ width: '100%', marginTop: 8 }}
                minuteStep={15}
              />
            </div>
          </Space>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelConfirmVisible}
        onCancel={() => {
          setCancelConfirmVisible(false);
          setSelectedBooking(null);
        }}
        footer={[
          <Button key="back" onClick={() => {
            setCancelConfirmVisible(false);
            setSelectedBooking(null);
          }}>
            Back
          </Button>,
          <Button
            key="cancel"
            danger
            onClick={handleCancelBooking}
            loading={actionLoading}
          >
            Confirm Cancellation
          </Button>
        ]}
      >
        {selectedBooking && (
          <div>
            <Title level={5}>Booking Details</Title>
            <p><strong>Customer:</strong> {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</p>
            <p><strong>Service:</strong> {selectedBooking.service.name}</p>
            <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
            <p><strong>Time:</strong> {formatTime(selectedBooking.time)}</p>
            
            <Divider />
            
            <div style={{ backgroundColor: '#fff0f0', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <Title level={5} style={{ color: '#d32f2f', marginTop: 0 }}>Important Information:</Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>This will cancel the booking immediately</li>
                <li style={{ marginBottom: 8 }}>An auto-refund of 50% advance payment will be processed to the customer</li>
                <li style={{ marginBottom: 8 }}>The customer will be notified of this cancellation</li>
                <li>The booking slot will be released back to your availability</li>
              </ul>
            </div>
            
            <div style={{ marginTop: 16, fontWeight: 'bold' }}>
              Are you sure you want to proceed with this cancellation?
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TherapistSchedule;