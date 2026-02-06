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
  TimePicker,
  Modal,
  Descriptions
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
import { formatCurrency } from '../../utils/currencyFormatter';

const { Title, Text } = Typography;
const { Option } = Select;

interface RescheduleModalProps {
  visible: boolean;
  booking: AssignedBooking | null;
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

interface BusinessInfo {
  id: string;
  country: string;
  currency: string;
}

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
  // Reschedule tracking fields
  originalDate?: Date;
  originalTime?: string;
  rescheduledBy?: string;
  rescheduledAt?: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
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
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null); // Add business info state
  const [therapists, setTherapists] = useState<{id: string, name: string}[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AssignedBooking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State variables are already defined above

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
      
      const url = '/api/business/assigned-bookings' + (queryParams.toString() ? '?' + queryParams.toString() : '');
      const response = await makeAuthenticatedRequest(url);
      
      console.log('Assigned bookings API response:', response);

      if (response.success && response.data) {
        setBookings(response.data.bookings);
        setSummary(response.data.summary);
        
        // Store business info if available in response
        if (response.data.business) {
          setBusinessInfo(response.data.business);
        }
        
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

  const showBookingDetails = async (booking: AssignedBooking) => {
    setRefreshing(true);
    // Refresh the booking data to ensure we have the latest information
    try {
      // Use the booking ID to get a specific booking if possible
      // Otherwise, fetch all assigned bookings to get the latest data
      const response = await makeAuthenticatedRequest(`/api/business/assigned-bookings`);
      if (response.success && response.data) {
        // Find the specific booking in the refreshed data
        const refreshedBooking = response.data.bookings.find((b: AssignedBooking) => b.id === booking.id);
        if (refreshedBooking) {
          setSelectedBooking(refreshedBooking);
        } else {
          // If not found in refreshed data, use the original booking
          setSelectedBooking(booking);
        }
      } else {
        // If refresh fails, use the original booking
        setSelectedBooking(booking);
      }
      
      // Also update business info if available in response
      if (response.data.business) {
        setBusinessInfo(response.data.business);
      }
    } catch (error) {
      console.error('Error refreshing booking data:', error);
      // If refresh fails, use the original booking
      setSelectedBooking(booking);
    } finally {
      setRefreshing(false);
    }
    
    setModalVisible(true);
  };

  const hideBookingDetails = () => {
    setModalVisible(false);
    setSelectedBooking(null);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
    if (filterTherapist !== 'all' && booking.therapist.id !== filterTherapist) return false;
    return true;
  });

  const handleReschedule = async (newDate: Date, newTime: string) => {
    if (!selectedBooking) return;

    try {
      setActionLoading(selectedBooking.id);
      const response = await makeAuthenticatedRequest(`/api/business/assigned-bookings/reschedule/${selectedBooking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ newDate, newTime })
      });

      if (response.success) {
        message.success('Booking rescheduled successfully');
        setRescheduleModalVisible(false);
        setSelectedBooking(null);
        await fetchAssignedBookings(); // Refresh the list
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
              styles={{ content: { color: '#faad14' } }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Confirmed"
              value={summary.confirmed}
              styles={{ content: { color: '#52c41a' } }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={summary.cancelled}
              styles={{ content: { color: '#ff4d4f' } }}
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
                            {businessInfo ? 
                              formatCurrency(booking.service.price, businessInfo.country) : 
                              `$${booking.service.price}`
                            } • {booking.service.duration} mins
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
                  <Space orientation="vertical">
                    <Button 
                      size="small"
                      onClick={async () => await showBookingDetails(booking)}
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
                    {(booking.status === 'pending' || booking.status === 'rescheduled') && (
                      <Button 
                        size="small"
                        type="primary"
                        onClick={async () => {
                          try {
                            const response = await makeAuthenticatedRequest(
                              `/api/business/assigned-bookings/confirm/${booking.id}`,
                              {
                                method: 'PATCH'
                              }
                            );
                            
                            if (response.success) {
                              message.success('Booking confirmed successfully');
                              // Refresh the data to reflect the new status
                              await fetchAssignedBookings();
                            } else {
                              message.error(response.error || 'Failed to confirm booking');
                            }
                          } catch (error) {
                            console.error('Error confirming booking:', error);
                            message.error('An error occurred while confirming the booking');
                          }
                        }}
                      >
                        Confirm
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                      <Button 
                        size="small"
                        onClick={async () => {
                          setSelectedBooking(booking);
                          setRescheduleModalVisible(true);
                        }}
                        loading={actionLoading === booking.id}
                      >
                        Reschedule
                      </Button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                      <Button 
                        size="small"
                        danger
                        onClick={async () => {
                          try {
                            const response = await makeAuthenticatedRequest(
                              `/api/business/assigned-bookings/cancel/${booking.id}`,
                              {
                                method: 'PATCH'
                              }
                            );
                            
                            if (response.success) {
                              message.success('Booking cancelled successfully');
                              // Refresh the data to reflect the new status
                              await fetchAssignedBookings();
                            } else {
                              message.error(response.error || 'Failed to cancel booking');
                            }
                          } catch (error) {
                            console.error('Error cancelling booking:', error);
                            message.error('An error occurred while cancelling the booking');
                          }
                        }}
                        loading={actionLoading === booking.id}
                      >
                        Cancel
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={modalVisible}
        onCancel={hideBookingDetails}
        footer={[
          <Button key="refresh" onClick={async () => {
            if (selectedBooking) {
              await showBookingDetails(selectedBooking);
            }
          }}
          loading={refreshing}
          >
            Refresh Data
          </Button>,
          <Button key="close" onClick={hideBookingDetails}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedBooking && !refreshing && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Booking ID">
              {selectedBooking.id}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Name">
              {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Email">
              {selectedBooking.customer.email}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Phone">
              {selectedBooking.customer.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Service">
              {selectedBooking.service.name}
            </Descriptions.Item>
            <Descriptions.Item label="Service Description">
              {selectedBooking.service.description}
            </Descriptions.Item>
            <Descriptions.Item label="Service Price">
              {selectedBooking && businessInfo ? 
                formatCurrency(selectedBooking.service.price, businessInfo.country) : 
                `$${selectedBooking?.service.price || 0}`
              }
            </Descriptions.Item>
            <Descriptions.Item label="Service Duration">
              {selectedBooking.service.duration} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Therapist">
              {selectedBooking.therapist.fullName} ({selectedBooking.therapist.professionalTitle})
            </Descriptions.Item>
            <Descriptions.Item label="Original Booking Date">
              {(selectedBooking.originalDate && selectedBooking.originalDate !== undefined) ? dayjs(selectedBooking.originalDate).format('MMMM D, YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Original Booking Time">
              {(selectedBooking.originalTime && selectedBooking.originalTime !== undefined && selectedBooking.originalTime !== '') ? selectedBooking.originalTime : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Current Booking Date">
              {dayjs(selectedBooking.date).format('MMMM D, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Current Booking Time">
              {selectedBooking.time}
            </Descriptions.Item>
            {selectedBooking.rescheduledAt && (
              <Descriptions.Item label="Rescheduled By Therapist">
                <div>
                  <p>Yes - This booking was rescheduled by the therapist</p>
                  <p><strong>Rescheduled At:</strong> {dayjs(selectedBooking.rescheduledAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedBooking.rescheduledBy && <p><strong>Rescheduled By:</strong> ID {selectedBooking.rescheduledBy}</p>}
                </div>
              </Descriptions.Item>
            )}
            {selectedBooking.confirmedAt && !selectedBooking.rescheduledAt && (
              <Descriptions.Item label="Confirmed By">
                <div>
                  <p>This booking was confirmed by a staff member</p>
                  <p><strong>Confirmed At:</strong> {dayjs(selectedBooking.confirmedAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedBooking.confirmedBy && <p><strong>Confirmed By:</strong> ID {selectedBooking.confirmedBy}</p>}
                </div>
              </Descriptions.Item>
            )}
            {selectedBooking.cancelledAt && (
              <Descriptions.Item label="Cancelled By">
                <div>
                  <p>This booking was cancelled</p>
                  <p><strong>Cancelled At:</strong> {dayjs(selectedBooking.cancelledAt).format('MMMM D, YYYY h:mm A')}</p>
                  {selectedBooking.cancelledBy && <p><strong>Cancelled By:</strong> ID {selectedBooking.cancelledBy}</p>}
                </div>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag 
                color={selectedBooking.status === 'pending' ? 'orange' : 
                      selectedBooking.status === 'confirmed' ? 'green' : 
                      selectedBooking.status === 'cancelled' ? 'red' : 
                      selectedBooking.status === 'rescheduled' ? 'blue' : 'default'}
                icon={selectedBooking.status === 'pending' ? <ClockCircleOutlined /> :
                      selectedBooking.status === 'confirmed' ? <CheckOutlined /> :
                      selectedBooking.status === 'cancelled' ? <CloseOutlined /> :
                      selectedBooking.status === 'rescheduled' ? <CalendarOutlined /> : undefined}
              >
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Assigned by Admin">
              {selectedBooking.assignedByAdmin ? 'Yes' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned By ID">
              {selectedBooking.assignedById}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {dayjs(selectedBooking.createdAt).format('MMMM D, YYYY h:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {dayjs(selectedBooking.updatedAt).format('MMMM D, YYYY h:mm A')}
            </Descriptions.Item>
            {selectedBooking.notes && (
              <Descriptions.Item label="Notes">
                {selectedBooking.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
        {refreshing && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Refreshing booking data...</Text>
            </div>
          </div>
        )}
      </Modal>

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

export default AssignedBookingsTracker;