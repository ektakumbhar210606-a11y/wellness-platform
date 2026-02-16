'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Tag, Space, Typography, Modal, Skeleton, Tabs, message } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';
import { formatCurrency } from '../../../../utils/currencyFormatter';
import BookingConfirmationModal from '@/app/components/BookingConfirmationModal';

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
      // Check if this is a Razorpay payment response
      if (formData.paymentDetails) {
        // Razorpay payment was successful
        const { paymentDetails } = formData;

        // Update local state to reflect the confirmed booking
        setBookings(bookings.map(booking =>
          booking.id === bookingToConfirm.id
            ? { ...booking, status: 'confirmed' }
            : booking
        ));

        // Show success message with payment details
        message.success(
          `Booking confirmed successfully! Payment completed. ` +
          `Payment ID: ${paymentDetails.razorpayPaymentId}`
        );
      } else {
        // Fallback to original behavior if no payment details
        message.success('Booking confirmed successfully!');
      }

      // Close modal
      setConfirmModalVisible(false);
      setBookingToConfirm(null);

    } catch (error: any) {
      console.error('Error confirming booking:', error);
      message.error('Failed to confirm booking. Please try again.');
    }
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
    </div>
  );
};

export default CustomerBookingsPage;