'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Tag, Space, Typography, Modal, Skeleton, Tabs, message, Descriptions } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';
import { formatCurrency } from '../../../../utils/currencyFormatter';
import { shouldRestrictReschedule } from '@/app/utils/bookingTimeUtils';
import BookingConfirmationModal from '@/app/components/BookingConfirmationModal';
import { CalendarOutlined, UserOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';

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
  const [cancellationReason, setCancellationReason] = useState('');

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
          // DEBUG: Log bookings to see if rescheduled booking is included
          console.log('Fetched bookings:', data.data.bookings);
          const rescheduledBooking = data.data.bookings.find((b: any) => b.status === 'rescheduled' || b.originalDate);
          if (rescheduledBooking) {
            console.log('Found rescheduled booking:', rescheduledBooking);
          }
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
        // Display status based on three-stage workflow
        let displayStatus = status;
        let color = 'orange'; // Default to pending/orange
        
        // Stage 1: Therapist confirmed, waiting for business
        if (record.status === 'therapist_confirmed' && record.responseVisibleToBusinessOnly === true) {
          displayStatus = 'Therapist Confirmed';
          color = 'blue';
        }
        // Stage 2: Business confirmed, waiting for customer payment
        else if (record.status === 'confirmed' && record.responseVisibleToBusinessOnly === false && record.paymentStatus === 'pending') {
          displayStatus = 'Ready for Payment';
          color = 'gold';
        }
        // Stage 3: Partial payment made
        else if (record.status === 'confirmed' && record.paymentStatus === 'partial') {
          displayStatus = 'Partially Paid';
          color = 'orange';
        }
        // Stage 4: Payment completed
        else if (record.status === 'confirmed' && record.paymentStatus === 'completed') {
          displayStatus = 'Confirmed';
          color = 'green';
        }
        // New status: Paid (payment completed)
        else if (record.status === 'paid') {
          displayStatus = 'Paid';
          color = 'green';
        }
        // Other statuses
        else if (status === 'cancelled') {
          color = 'red';
        } else if (status === 'completed') {
          color = 'gray';
        } else if (status === 'rescheduled') {
          color = 'gold';
        } else if (status === 'pending') {
          color = 'orange';
        }
    
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {displayStatus}
            {record.status === 'confirmed' && record.responseVisibleToBusinessOnly === false && record.paymentStatus === 'pending' && (
              <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
                (Awaiting Payment)
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
          {/* Show different actions based on business response type */}
          {record.paymentStatus === 'pending' && (record.confirmedBy || record.cancelledBy || record.rescheduledBy || record.responseVisibleToBusinessOnly) ? (
            // Business response awaiting payment
            <>
              {record.rescheduledBy ? (
                // Business has rescheduled - show accept/decline actions
                <>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setBookingToConfirm(record);
                      setConfirmModalVisible(true);
                    }}
                  >
                    Accept Reschedule
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setBookingToCancel(record);
                      setCancelModalVisible(true);
                    }}
                  >
                    Decline & Cancel
                  </Button>
                </>
              ) : (
                // Regular confirmation - just pay
                <>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setBookingToConfirm(record);
                      setConfirmModalVisible(true);
                    }}
                  >
                    Confirm Payment
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
            // Payment completed - show regular actions
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
        <Tag color={record.paymentStatus === 'partial' ? 'orange' : 'green'}>
          {record.paymentStatus === 'partial' ? 'Partially Paid' : 'Fully Paid'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        // Display status based on three-stage workflow
        let displayStatus = status;
        let color = 'orange'; // Default to pending/orange
        
        // Stage 1: Therapist confirmed, waiting for business
        if (record.status === 'therapist_confirmed' && record.responseVisibleToBusinessOnly === true) {
          displayStatus = 'Therapist Confirmed';
          color = 'blue';
        }
        // Stage 2: Business confirmed, waiting for customer payment
        else if (record.status === 'confirmed' && record.responseVisibleToBusinessOnly === false && record.paymentStatus === 'pending') {
          displayStatus = 'Ready for Payment';
          color = 'gold';
        }
        // Special case: Business has rescheduled - awaiting customer response
        else if (record.status === 'rescheduled' && record.rescheduledBy && record.paymentStatus === 'pending') {
          displayStatus = 'Rescheduled by Business';
          color = 'purple';
        }
        // Stage 3: Partial payment made
        else if (record.status === 'confirmed' && record.paymentStatus === 'partial') {
          displayStatus = 'Partially Paid';
          color = 'orange';
        }
        // Stage 4: Payment completed
        else if (record.status === 'confirmed' && record.paymentStatus === 'completed') {
          displayStatus = 'Confirmed';
          color = 'green';
        }
        // New status: Paid (payment completed)
        else if (record.status === 'paid') {
          displayStatus = 'Paid';
          color = 'green';
        }
        // Other statuses
        else if (status === 'cancelled') {
          color = 'red';
        } else if (status === 'completed') {
          color = 'gray';
        } else if (status === 'rescheduled') {
          color = 'gold';
        } else if (status === 'pending') {
          color = 'orange';
        }
    
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {displayStatus}
            {record.status === 'confirmed' && record.responseVisibleToBusinessOnly === false && record.paymentStatus === 'pending' && (
              <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
                (Awaiting Payment)
              </span>
            )}
            {record.status === 'rescheduled' && record.rescheduledBy && record.paymentStatus === 'pending' && (
              <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
                (Awaiting Your Response)
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
          {/* Show different actions based on the booking stage */}
          {record.status === 'therapist_confirmed' && record.responseVisibleToBusinessOnly === true ? (
            // Stage 1: Therapist confirmed, waiting for business - show limited actions
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
          ) : record.status === 'confirmed' && record.responseVisibleToBusinessOnly === false && record.paymentStatus === 'pending' ? (
            // Stage 2: Business confirmed, waiting for customer payment
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setBookingToConfirm(record);
                  setConfirmModalVisible(true);
                }}
              >
                Confirm Payment
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
            // Stage 3: Payment completed or other status - show normal actions
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

  // Columns for cancelled bookings tab
  const cancelledColumns = [
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
      title: 'Cancel Reason',
      key: 'cancelReason',
      render: (record: any) => {
        // Debug: Log the entire record to see what fields are available
        console.log('Booking cancel data:', {
          id: record.id,
          businessCancelReason: record.businessCancelReason,
          therapistCancelReason: record.therapistCancelReason,
          customerCancelReason: record.customerCancelReason,
          cancelReason: record.cancelReason,
          cancelledBy: record.cancelledBy,
          status: record.status
        });
        
        // Check for cancellation reason based on who cancelled
        let reason = 'Not specified';
        let icon = '';
        let color = 'inherit';
        
        if (record.customerCancelReason) {
          // Customer-initiated cancellation
          reason = record.customerCancelReason;
          icon = '👤 ';
          color = '#52c41a'; // Green for customer cancellation
        } else if (record.businessCancelReason) {
          // Business-initiated cancellation
          reason = record.businessCancelReason;
          icon = '🏢 ';
          color = '#1890ff'; // Blue for business cancellation
        } else if (record.therapistCancelReason) {
          // Therapist-initiated cancellation
          reason = record.therapistCancelReason;
          icon = '📍 ';
          color = '#d32f2f'; // Red for therapist cancellation
        } else if (record.cancelReason) {
          // Fallback to generic cancelReason
          reason = record.cancelReason;
        }
        
        return (
          <Text 
            style={{ maxWidth: 250, color: color }} 
            ellipsis
            title={reason}
          >
            {icon}{reason}
          </Text>
        );
      },
    },
    {
      title: 'Refund Status',
      key: 'refundStatus',
      render: (record: any) => {
        // Determine refund amount based on who cancelled
        const totalAmount = record.finalPrice || record.service?.price || 0;
        let refundAmount = 0;
        let isProcessing = false;
        let showPenalty = false;
        
        if (record.status === 'cancelled_by_therapist') {
          // Therapist cancellation - full refund
          refundAmount = totalAmount * 0.5;
          isProcessing = true;
        } else if (record.cancelledBy && record.customerCancelReason) {
          // Customer cancellation - 90% of advance (10% penalty)
          refundAmount = totalAmount * 0.5 * 0.9; // 45% of total
          showPenalty = true;
        } else {
          // Default - full advance refund
          refundAmount = totalAmount * 0.5;
        }
        
        return (
          <div>
            <Tag color={isProcessing ? 'orange' : 'green'}>
              {isProcessing ? 'Refund Processing' : 'Refunded'}
            </Tag>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatCurrency(refundAmount, record.business?.address?.country || 'default')}
            </Text>
            {showPenalty && (
              <div style={{ fontSize: '10px', color: '#faad14', marginTop: '2px' }}>
                ⚠️ 10% cancellation fee applied
              </div>
            )}
            {isProcessing && (
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  ⏳ 3-7 business days
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cancelled By',
      key: 'cancelledBy',
      render: (record: any) => {
        // Determine who cancelled based on status and context
        if (record.status === 'cancelled_by_therapist') {
          // Therapist-initiated cancellation approved by business
          return <Tag color="orange">Therapist</Tag>;
        } else if (record.status === 'therapist_cancel_requested') {
          // Pending business approval
          return <Tag color="gold">Pending Approval</Tag>;
        } else if (record.businessCancelReason) {
          // Business-initiated cancellation
          return <Tag color="purple">Business</Tag>;
        } else if (record.cancelledBy) {
          // For other cancellations, check if it's customer or business
          // If therapistCancelReason exists, it was therapist-initiated even if status is just 'cancelled'
          if (record.therapistCancelReason) {
            return <Tag color="orange">Therapist</Tag>;
          }
          // Default to Customer for customer-initiated cancellations
          return <Tag color="blue">Customer</Tag>;
        }
        return <Tag color="default">System</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let displayStatus = status;
        let color = 'red';
        
        if (status === 'cancelled_by_therapist') {
          displayStatus = 'Cancelled by Therapist';
          color = 'red';
        } else if (status === 'therapist_cancel_requested') {
          displayStatus = 'Pending Approval';
          color = 'orange';
        }
        
        return <Tag color={color} style={{ textTransform: 'capitalize' }}>{displayStatus}</Tag>;
      },
    },
  ];

  const handleCancelBooking = async () => {
    try {
      if (!bookingToCancel) return;

      console.log('Attempting to cancel booking:', {
        id: bookingToCancel.id,
        status: bookingToCancel.status,
        paymentStatus: bookingToCancel.paymentStatus
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Call the customer booking cancellation API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customer/bookings/${bookingToCancel.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cancelReason: cancellationReason || 'Customer requested cancellation'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Cancellation failed:', data);
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Remove cancelled booking from the list
      setBookings(bookings.filter(b => b.id !== bookingToCancel.id));
      
      message.success(
        `Booking cancelled successfully. Refund of ${formatCurrency(
          data.data.refundDetails.refundAmount, 
          bookingToCancel.business?.address?.country || 'default'
        )} will be processed (10% cancellation fee applied).`
      );
      
      setCancelModalVisible(false);
      setBookingToCancel(null);
      setCancellationReason('');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      message.error(error.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async (formData: any) => {
    try {
      if (formData.paymentDetails) {
        const { paymentDetails } = formData;
        setBookings(bookings.map(booking =>
          booking.id === bookingToConfirm.id
            ? { ...booking, status: 'paid', paymentStatus: 'completed' }
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

  // Filter bookings based on active tab - implement three-stage workflow
  const bookingRequests = bookings.filter(booking => {
    // Stage 1: Therapist confirms booking (status: therapist_confirmed, responseVisibleToBusinessOnly: true)
    // Stage 2: Business confirms therapist's response (status: confirmed, responseVisibleToBusinessOnly: false)
    // Stage 3: Customer pays (paymentStatus: pending -> partial -> completed)
    // Special case: Business has rescheduled (status: rescheduled, rescheduledBy exists, paymentStatus: pending)
    // Excluded: Bookings with 'paid' status and bookings with partial/completed payment (these go to confirmed tab)
    
    // DEBUG: Log if this is a rescheduled booking
    if (booking.status === 'rescheduled' || booking.originalDate) {
      console.log('DEBUG - Checking rescheduled booking:', {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        responseVisibleToBusinessOnly: booking.responseVisibleToBusinessOnly,
        rescheduledBy: booking.rescheduledBy,
        confirmedBy: booking.confirmedBy
      });
    }
    
    // IMMEDIATELY exclude bookings with 'paid' status
    if (booking.status === 'paid') {
      return false;
    }
    
    // Exclude confirmed bookings with partial/completed payment UNLESS they are rescheduled
    // Rescheduled bookings should appear in requests tab regardless of payment status
    if (booking.status === 'confirmed' && 
        (booking.paymentStatus === 'partial' || booking.paymentStatus === 'completed')) {
      return false;
    }
    
    // Don't exclude rescheduled bookings based on payment status - they need customer response first
    
    // Show in requests tab when:
    // 1. Therapist has confirmed the booking but business hasn't processed it yet
    // 2. Business has confirmed the booking and customer needs to pay (pending payment only)
    // 3. Business/Therapist has rescheduled the booking and customer needs to respond (any payment status - even partial payment needs acceptance)
    const isTherapistConfirmedWaitingForBusiness = 
      booking.status === 'therapist_confirmed' && 
      booking.responseVisibleToBusinessOnly === true;
    
    const isBusinessConfirmedWaitingForCustomerPayment = 
      booking.status === 'confirmed' && 
      booking.responseVisibleToBusinessOnly === false && 
      booking.paymentStatus === 'pending';
    
    const isBusinessRescheduledAwaitingCustomerResponse = 
      (booking.status === 'rescheduled' || booking.originalDate || booking.originalTime) && 
      booking.rescheduledBy && 
      (!booking.confirmedBy || booking.confirmedBy === booking.customer?.id); // If not confirmed by customer themselves, show in requests
    
    // DEBUG: Check each condition individually
    if (booking.status === 'rescheduled' || booking.originalDate) {
      console.log('DEBUG - Individual conditions:', {
        id: booking.id,
        hasRescheduledStatus: booking.status === 'rescheduled',
        hasOriginalDate: !!booking.originalDate,
        hasOriginalTime: !!booking.originalTime,
        hasRescheduledBy: !!booking.rescheduledBy,
        rescheduledByValue: booking.rescheduledBy,
        hasNoConfirmedBy: !booking.confirmedBy,
        confirmedByValue: booking.confirmedBy,
        customerId: booking.customer?.id,
        customerField: booking.customer,
        confirmedByMatchesCustomer: booking.confirmedBy === booking.customer?.id,
        finalResult: isBusinessRescheduledAwaitingCustomerResponse
      });
    }
    
    const result = isTherapistConfirmedWaitingForBusiness || 
           isBusinessConfirmedWaitingForCustomerPayment ||
           isBusinessRescheduledAwaitingCustomerResponse;
    
    // DEBUG: Log why a rescheduled booking was included/excluded
    if (booking.status === 'rescheduled' || booking.originalDate) {
      console.log('DEBUG - Filter result:', {
        id: booking.id,
        isTherapistConfirmedWaitingForBusiness,
        isBusinessConfirmedWaitingForCustomerPayment,
        isBusinessRescheduledAwaitingCustomerResponse,
        includedInRequests: result
      });
    }
    
    return result;
  });
  
  // Confirmed bookings: bookings that have partial or full payment completed
  const confirmedBookings = bookings.filter(booking => {
    // Include bookings that are confirmed and have partial or full payment completed
    return (booking.status === 'confirmed' || booking.status === 'paid') && 
           (booking.paymentStatus === 'partial' || booking.paymentStatus === 'completed');
  });

  // Cancelled bookings: includes therapist cancellations with refund
  const cancelledBookings = bookings.filter(booking => {
    return booking.status === 'cancelled' || 
           booking.status === 'cancelled_by_therapist' ||
           booking.status === 'therapist_cancel_requested';
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
          {
            key: 'cancelled',
            label: 'Cancelled Bookings',
            children: (
              <Card style={{ marginTop: 24 }}>
                <Table
                  columns={cancelledColumns}
                  dataSource={cancelledBookings}
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
        onCancel={() => {
          setCancelModalVisible(false);
          setBookingToCancel(null);
          setCancellationReason('');
        }}
        okText="Yes, Cancel"
        cancelText="No, Keep Booking"
        destroyOnHidden
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Are you sure you want to cancel the booking for <strong>{bookingToCancel?.service?.name || 'N/A'}</strong> on {bookingToCancel?.date ? new Date(bookingToCancel.date).toLocaleDateString() : 'N/A'} at {formatTimeTo12Hour(bookingToCancel?.time || '')}?</p>
        </div>

        {/* Cancellation Policy Notice */}
        <div style={{ 
          backgroundColor: '#fff7e6', 
          border: '1px solid #ffd591', 
          borderRadius: '4px', 
          padding: '12px', 
          marginBottom: '16px' 
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 500, color: '#d46b08' }}>
            ⚠️ Cancellation Policy
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '13px' }}>
            <li>Cancellations made within 24 hours of the booking time are not allowed</li>
            <li>A 10% cancellation fee will be charged on the advance payment</li>
            <li>You paid: <strong>{formatCurrency(bookingToCancel?.service?.price || 0, bookingToCancel?.business?.address?.country || 'default')}</strong></li>
            <li>Advance paid (50%): <strong>{formatCurrency((bookingToCancel?.service?.price || 0) * 0.5, bookingToCancel?.business?.address?.country || 'default')}</strong></li>
            <li>Cancellation fee (10% of advance): <strong>{formatCurrency((bookingToCancel?.service?.price || 0) * 0.5 * 0.1, bookingToCancel?.business?.address?.country || 'default')}</strong></li>
            <li style={{ fontWeight: 600, marginTop: '4px' }}>
              Refund amount: <strong>{formatCurrency((bookingToCancel?.service?.price || 0) * 0.5 * 0.9, bookingToCancel?.business?.address?.country || 'default')}</strong>
            </li>
          </ul>
        </div>

        {/* Cancellation Reason Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Cancellation Reason (optional)</label>
          <textarea
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Please provide a reason for cancellation..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          />
        </div>

        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          The refund will be processed to your original payment method within 3-7 business days.
        </p>
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
        destroyOnHidden
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

              <Descriptions.Item label="Price">
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