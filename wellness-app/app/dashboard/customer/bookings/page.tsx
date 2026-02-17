'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Tag, Space, Typography, Modal, Skeleton, Tabs, message, Descriptions } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';
import { formatCurrency } from '../../../../utils/currencyFormatter';
import { shouldRestrictReschedule } from '@/app/utils/bookingTimeUtils';
import BookingConfirmationModal from '@/app/components/BookingConfirmationModal';
import { CalendarOutlined, UserOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, DollarCircleOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CustomerBookingsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: null as number | null,
    upcomingBookings: null as number | null,
    completedBookings: null as number | null,
  });
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('requests');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState<any>(null);
  
  // State for booking details modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) return;

    const fetchBookings = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bookings?page=1&limit=50`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch bookings');
        }

        const data = await response.json();
        if (data.success) {
          setBookings(data.data.bookings);
        } else {
          throw new Error(data.error || 'Failed to fetch bookings');
        }
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        // Optionally show error message to user
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, router, authLoading]);

  // Columns for booking requests tab
  const requestColumns = [
    {
      title: 'Booking ID',
      key: 'id',
      render: (record: any) => record.displayId || record.id,
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (text: string, record: any) => record.therapist?.fullName || 'Not assigned',
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (record: any) => `${record.date} at ${formatTimeTo12Hour(record.time)}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (text: number, record: any) => record.duration || record.service?.duration || 'N/A',
    },
    {
      title: 'Price',
      dataIndex: ['service', 'price'],
      key: 'price',
      render: (price: number, record: any) => {
        const country = record.business?.address?.country || 'default';
        return price ? formatCurrency(price, country) : 'N/A';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        // If therapist response should only be visible to business, show the original status
        const displayStatus = record.responseVisibleToBusinessOnly ? 'pending' : status;
        let color = 'green';
        if (displayStatus === 'cancelled') color = 'red';
        if (displayStatus === 'pending') color = 'orange';
        if (displayStatus === 'confirmed') color = 'blue';
        if (displayStatus === 'completed') color = 'gray';
        if (displayStatus === 'rescheduled') color = 'gold';
    
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {displayStatus}
            {record.responseVisibleToBusinessOnly && (
              <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
                (Processing)
              </span>
            )}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="small" wrap>
          {/* Show different actions based on whether therapist response should be visible to business only */}
          {record.responseVisibleToBusinessOnly ? (
            <>
              <Button
                size="small"
                type="default"
                disabled
                title="This booking is being processed by the business"
              >
                Processing
              </Button>
              <Button
                size="small"
                type="default"
                onClick={() => router.push(`/bookings/${record.id}/details`)}
              >
                View Details
              </Button>
              {!shouldRestrictReschedule(record.date, record.time, 'customer') && (
                <Button
                  size="small"
                  onClick={() => router.push(`/bookings/${record.id}/reschedule`)}
                >
                  Reschedule
                </Button>
              )}
            </>
          ) : (
            <>
              {record.status !== 'cancelled' && (
                <>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => {
                      setBookingToConfirm(record);
                      setConfirmModalVisible(true);
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setBookingToCancel(record);
                      setCancelModalVisible(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    onClick={() => router.push(`/bookings/${record.id}/reschedule`)}
                  >
                    Reschedule
                  </Button>
                </>
              )}
              <Button
                size="small"
                type="default"
                onClick={() => router.push(`/bookings/${record.id}/details`)}
              >
                View Details
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Columns for confirmed bookings tab
  const confirmedColumns = [
    {
      title: 'Booking ID',
      key: 'id',
      render: (record: any) => record.displayId || record.id,
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (text: string, record: any) => record.therapist?.fullName || 'Not assigned',
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (record: any) => `${record.date} at ${formatTimeTo12Hour(record.time)}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (text: number, record: any) => record.duration || record.service?.duration || 'N/A',
    },
    {
      title: 'Price',
      dataIndex: ['service', 'price'],
      key: 'price',
      render: (price: number, record: any) => {
        const country = record.business?.address?.country || 'default';
        return price ? formatCurrency(price, country) : 'N/A';
      },
    },
    {
      title: 'Payment Status',
      key: 'paymentStatus',
      render: (record: any) => (
        <Tag color="green">Paid</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        // If therapist response should only be visible to business, show the original status
        const displayStatus = record.responseVisibleToBusinessOnly ? 'pending' : status;
        let color = 'blue';
        if (displayStatus === 'cancelled') color = 'red';
        if (displayStatus === 'pending') color = 'orange';
        if (displayStatus === 'confirmed') color = 'blue';
        if (displayStatus === 'completed') color = 'gray';
        if (displayStatus === 'rescheduled') color = 'gold';

        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {displayStatus}
            {record.responseVisibleToBusinessOnly && (
              <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
                (Processing)
              </span>
            )}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="small" wrap>
          {/* Show different actions based on whether therapist response should be visible to business only */}
          {record.responseVisibleToBusinessOnly ? (
            <>
              {!shouldRestrictReschedule(record.date, record.time, 'customer') && (
                <Button
                  size="small"
                  onClick={() => router.push(`/bookings/${record.id}/reschedule`)}
                >
                  Reschedule
                </Button>
              )}
              <Button
                size="small"
                type="default"
                disabled
                title="This booking is being processed by the business"
              >
                Processing
              </Button>
              <Button
                size="small"
                type="default"
                onClick={() => router.push(`/bookings/${record.id}/details`)}
              >
                View Details
              </Button>
            </>
          ) : (
            <>
              {record.status !== 'cancelled' && (
                <>
                  <Button
                    size="small"
                    onClick={() => router.push(`/bookings/${record.id}/reschedule`)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setBookingToCancel(record);
                      setCancelModalVisible(true);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button
                size="small"
                type="default"
                onClick={() => router.push(`/bookings/${record.id}/details`)}
              >
                View Details
              </Button>
            </>
          )}
          <Button
            size="small"
            type="default"
            onClick={() => showBookingDetails(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const handleCancelBooking = async () => {
    try {
      // For customer-initiated cancellations, we should use the proper customer booking cancellation endpoint
      // However, since this is a business-assigned booking, the customer shouldn't be able to cancel it directly
      // The business should handle cancellations through their assigned-bookings interface
      throw new Error('Cannot cancel business-assigned bookings directly. Please contact the business.');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      // Optionally show error message to user
      message.error(error.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async (formData: any) => {
    try {
      if (formData.paymentDetails) {
        const { paymentDetails } = formData;
        setBookings(bookings.map(booking =>
          booking.id === bookingToConfirm.id
            ? { ...booking, status: 'confirmed' }
            : booking
        ));
        message.success(
          `Booking confirmed successfully! Payment completed. ` +
          `Payment ID: ${paymentDetails.razorpayPaymentId}`
        );
      } else {
        message.success('Booking confirmed successfully!');
      }
      setConfirmModalVisible(false);
      setBookingToConfirm(null);
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      message.error('Failed to confirm booking. Please try again.');
    }
  };

  // Function to fetch and show booking details
  const showBookingDetails = async (booking: any) => {
    try {
      setLoadingDetails(true);
      setSelectedBooking(null);
      setDetailsModalVisible(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bookings/${booking.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch booking details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedBooking(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch booking details');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      message.error(error.message || 'Failed to load booking details');
      setDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Function to close booking details modal
  const hideBookingDetails = () => {
    setDetailsModalVisible(false);
    setSelectedBooking(null);
  };

  if (!user || user.role.toLowerCase() !== 'customer') {
    return null; // Or render a redirect message
  }

  // Filter bookings based on active tab - respect responseVisibleToBusinessOnly flag
  const bookingRequests = bookings.filter(booking => {
    // If therapist response should only be visible to business, treat as pending regardless of actual status
    if (booking.responseVisibleToBusinessOnly) {
      return true; // Show in requests tab
    }
    return booking.status !== 'confirmed';
  });
  
  const confirmedBookings = bookings.filter(booking => {
    // Only show as confirmed if not restricted to business visibility
    return booking.status === 'confirmed' && !booking.responseVisibleToBusinessOnly;
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>My Bookings</Title>
      <Text>View and manage your appointments</Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'requests',
            label: 'Booking Requests',
            children: (
              <Card style={{ marginTop: 24 }}>
                <Table
                  columns={requestColumns}
                  dataSource={bookingRequests}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'confirmed',
            label: 'Confirmed Bookings',
            children: (
              <Card style={{ marginTop: 24 }}>
                <Table
                  columns={confirmedColumns}
                  dataSource={confirmedBookings}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Confirm Cancellation"
        open={cancelModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setCancelModalVisible(false)}
        okText="Yes, Cancel"
        cancelText="No, Keep Booking"
      >
        <p>Are you sure you want to cancel the booking for <strong>{bookingToCancel?.service?.name || 'N/A'}</strong> on {bookingToCancel?.date ? new Date(bookingToCancel.date).toLocaleDateString() : 'N/A'} at {formatTimeTo12Hour(bookingToCancel?.time || '')}?</p>
        <p>Please note that cancellation policies may apply depending on how far in advance you cancel.</p>
      </Modal>

      <BookingConfirmationModal
        visible={confirmModalVisible}
        booking={bookingToConfirm}
        onCancel={() => {
          setConfirmModalVisible(false);
          setBookingToConfirm(null);
        }}
        onConfirm={handleConfirmBooking}
      />

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={detailsModalVisible}
        onCancel={hideBookingDetails}
        footer={[
          <Button key="close" onClick={hideBookingDetails}>
            Close
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : selectedBooking ? (
          <div>
            {/* Booking Summary Card */}
            <Card 
              size="small" 
              style={{ marginBottom: 24, backgroundColor: '#f0f9ff', border: '1px solid #bae7ff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                    Booking #{selectedBooking.displayId}
                  </Title>
                  <Tag 
                    color={
                      selectedBooking.status === 'confirmed' ? 'green' : 
                      selectedBooking.status === 'pending' ? 'orange' : 
                      selectedBooking.status === 'cancelled' ? 'red' : 
                      selectedBooking.status === 'rescheduled' ? 'blue' : 'default'
                    }
                    style={{ marginTop: 8, textTransform: 'capitalize' }}
                  >
                    {selectedBooking.status}
                  </Tag>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary">Booked on</Text>
                  <br />
                  <Text strong>
                    {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </div>
              </div>
            </Card>

            <Descriptions column={1} bordered size="small">
              {/* Service Information */}
              <Descriptions.Item label={
                <span><FileTextOutlined style={{ marginRight: 8 }} />Service</span>
              }>
                <div>
                  <Text strong>{selectedBooking.service?.name || 'N/A'}</Text>
                  {selectedBooking.service?.description && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{selectedBooking.service.description}</Text>
                    </div>
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label={
                <span><DollarCircleOutlined style={{ marginRight: 8 }} />Price</span>
              }>
                {selectedBooking.service?.price ? 
                  formatCurrency(selectedBooking.service.price, selectedBooking.business?.country || 'default') : 
                  'N/A'
                }
              </Descriptions.Item>

              <Descriptions.Item label={
                <span><ClockCircleOutlined style={{ marginRight: 8 }} />Duration</span>
              }>
                {selectedBooking.service?.duration ? `${selectedBooking.service.duration} minutes` : 'N/A'}
              </Descriptions.Item>

              {/* Therapist Information */}
              <Descriptions.Item label={
                <span><UserOutlined style={{ marginRight: 8 }} />Therapist</span>
              }>
                <div>
                  <Text strong>{selectedBooking.therapist?.fullName || 'Not assigned'}</Text>
                  {selectedBooking.therapist?.professionalTitle && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{selectedBooking.therapist.professionalTitle}</Text>
                    </div>
                  )}
                  {selectedBooking.therapist?.email && (
                    <div style={{ marginTop: 4 }}>
                      <MailOutlined style={{ marginRight: 4 }} />
                      <Text type="secondary">{selectedBooking.therapist.email}</Text>
                    </div>
                  )}
                  {selectedBooking.therapist?.phone && (
                    <div style={{ marginTop: 4 }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      <Text type="secondary">{selectedBooking.therapist.phone}</Text>
                    </div>
                  )}
                </div>
              </Descriptions.Item>

              {/* Business Information */}
              {selectedBooking.business && (
                <Descriptions.Item label={
                  <span><UserOutlined style={{ marginRight: 8 }} />Business</span>
                }>
                  <div>
                    <Text strong>{selectedBooking.business.name}</Text>
                    {selectedBooking.business.address?.street && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">
                          {selectedBooking.business.address.street}
                          {selectedBooking.business.address.city && `, ${selectedBooking.business.address.city}`}
                          {selectedBooking.business.address.state && `, ${selectedBooking.business.address.state}`}
                          {selectedBooking.business.address.zipCode && ` ${selectedBooking.business.address.zipCode}`}
                        </Text>
                      </div>
                    )}
                    {selectedBooking.business.email && (
                      <div style={{ marginTop: 4 }}>
                        <MailOutlined style={{ marginRight: 4 }} />
                        <Text type="secondary">{selectedBooking.business.email}</Text>
                      </div>
                    )}
                    {selectedBooking.business.phone && (
                      <div style={{ marginTop: 4 }}>
                        <PhoneOutlined style={{ marginRight: 4 }} />
                        <Text type="secondary">{selectedBooking.business.phone}</Text>
                      </div>
                    )}
                  </div>
                </Descriptions.Item>
              )}

              {/* Booking Date & Time */}
              <Descriptions.Item label={
                <span><CalendarOutlined style={{ marginRight: 8 }} />Booking Date</span>
              }>
                {selectedBooking.date ? 
                  new Date(selectedBooking.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  }) : 'N/A'
                }
              </Descriptions.Item>

              <Descriptions.Item label={
                <span><ClockCircleOutlined style={{ marginRight: 8 }} />Booking Time</span>
              }>
                {selectedBooking.time ? formatTimeTo12Hour(selectedBooking.time) : 'N/A'}
              </Descriptions.Item>

              {/* Rescheduling Information */}
              {selectedBooking.hasBeenRescheduled && (
                <>
                  <Descriptions.Item label="Original Booking Date">
                    {selectedBooking.originalDate ? 
                      new Date(selectedBooking.originalDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      }) : 'N/A'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Original Booking Time">
                    {selectedBooking.originalTime ? formatTimeTo12Hour(selectedBooking.originalTime) : 'N/A'}
                  </Descriptions.Item>
                </>
              )}

              {/* Additional Information */}
              {selectedBooking.notes && (
                <Descriptions.Item label="Notes">
                  <Text>{selectedBooking.notes}</Text>
                </Descriptions.Item>
              )}

              {selectedBooking.specialRequests && (
                <Descriptions.Item label="Special Requests">
                  <Text>{selectedBooking.specialRequests}</Text>
                </Descriptions.Item>
              )}

              {selectedBooking.paymentStatus && (
                <Descriptions.Item label="Payment Status">
                  <Tag 
                    color={
                      selectedBooking.paymentStatus === 'completed' ? 'green' : 
                      selectedBooking.paymentStatus === 'pending' ? 'orange' : 
                      selectedBooking.paymentStatus === 'failed' ? 'red' : 'default'
                    }
                  >
                    {selectedBooking.paymentStatus}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text>No booking details available</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerBookingsPage;