'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Spin, 
  message, 
  Tabs, 
  Typography,
  Modal,
  Descriptions,
  Form,
  Input
} from 'antd';
import { formatCurrency, getCurrencySymbol } from '../../utils/currencyFormatter';
import { shouldRestrictReschedule } from '../utils/bookingTimeUtils';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Booking {
  id: string;
  displayId?: string; // User-friendly display ID
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
    business?: {
      id: string;
      name: string;
      address?: {
        country: string;
      };
      currency?: string;
    };
  };
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  };
  date: string;
  time: string;
  currentDate?: string;
  currentTime?: string;
  duration: number;
  status: 'pending' | 'therapist_confirmed' | 'therapist_rejected' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' | 'therapist_cancel_requested';
  notes?: string;
  assignedByAdmin?: boolean;
  createdAt: string;
  originalDate?: Date | null;
  originalTime?: string | null;
  hasBeenRescheduled?: boolean;
  therapistCancelReason?: string;
  therapistCancelRequestedAt?: Date;
  businessReviewStatus?: 'pending' | 'approved' | 'rejected';
  advancePaid?: number;
  businessCancelReason?: string;
}

interface BookingManagementProps {
  businessId?: string;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  // Fetch booking requests (pending and rescheduled bookings)
  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/business?status=requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch booking requests');
      }
      
      setBookingRequests(result.data || []);
    } catch (error: any) {
      console.error('Error fetching booking requests:', error);
      message.error(error.message || 'Failed to load booking requests');
      setBookingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch confirmed bookings
  const fetchConfirmedBookings = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/business?status=confirmed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch confirmed bookings');
      }
      
      setConfirmedBookings(result.data || []);
    } catch (error: any) {
      console.error('Error fetching confirmed bookings:', error);
      message.error(error.message || 'Failed to load confirmed bookings');
      setConfirmedBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cancelled bookings (therapist cancellations awaiting business approval)
  const fetchCancelledBookings = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/therapist-cancel-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch cancelled bookings');
      }
      
      // Map the cancel requests to Booking format for the table
      const formattedBookings = (result.data || []).map((request: any) => ({
        id: request.id,
        displayId: request.displayId,
        customer: request.customer,
        service: request.service,
        therapist: request.therapist,
        date: request.bookingDetails.date,
        time: request.bookingDetails.time,
        status: 'therapist_cancel_requested',
        therapistCancelReason: request.cancelRequest.reason,
        therapistCancelRequestedAt: request.cancelRequest.requestedAt,
        businessReviewStatus: request.cancelRequest.reviewStatus,
        paymentStatus: request.paymentInfo.paymentStatus,
        advancePaid: request.paymentInfo.advancePaid,
        createdAt: request.createdAt
      }));
      
      setCancelledBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error fetching cancelled bookings:', error);
      message.error(error.message || 'Failed to load cancelled bookings');
      setCancelledBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/assigned-bookings/confirm/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm booking');
      }
      
      message.success('Booking confirmed successfully!');
      // Refresh both lists
      await Promise.all([fetchBookingRequests(), fetchConfirmedBookings()]);
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      message.error(error.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle booking cancellation (old method - direct cancel)
  const handleCancelBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/assigned-bookings/cancel/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }
      
      message.success('Booking cancelled successfully!');
      // Refresh both lists
      await Promise.all([fetchBookingRequests(), fetchConfirmedBookings()]);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      message.error(error.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Show cancel modal for business-initiated cancellation
  const showCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  // Handle business-initiated cancellation with reason
  const handleBusinessCancellation = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      message.error('Please provide a cancellation reason');
      return;
    }

    try {
      setCancellingBookingId(selectedBooking.id);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/assigned-bookings/cancel/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          cancelReason: cancelReason.trim(),
          initiatedBy: 'business'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }
      
      message.success('Booking cancelled successfully! Refund will be processed to customer.');
      setCancelModalVisible(false);
      setSelectedBooking(null);
      setCancelReason('');
      
      // Refresh lists
      await Promise.all([
        fetchBookingRequests(), 
        fetchConfirmedBookings(),
        fetchCancelledBookings()
      ]);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      message.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Handle approve therapist cancellation (with refund)
  const handleApproveCancellation = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/therapist-cancel-requests/${bookingId}/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve cancellation');
      }
      
      message.success('Cancellation approved. 50% refund will be processed to customer.');
      await fetchCancelledBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving cancellation:', error);
      message.error(error.message || 'Failed to approve cancellation');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject therapist cancellation
  const handleRejectCancellation = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/therapist-cancel-requests/${bookingId}/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reject' })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject cancellation');
      }
      
      message.success('Cancellation request rejected. Booking remains confirmed.');
      await fetchCancelledBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Error rejecting cancellation:', error);
      message.error(error.message || 'Failed to reject cancellation');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle booking rescheduling
  const handleRescheduleBooking = async (booking: Booking) => {
    try {
      setActionLoading(booking.id);
        
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
        
      // For demonstration, we'll use today's date + 1 day and same time
      // In a real implementation, this would come from a date/time picker
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 1);
      // Use the original time if available, otherwise current time
      const newTime = booking.originalTime || booking.time || '10:00';
        
      // Use the business reschedule endpoint instead of the general one
      const response = await fetch(`/api/business/assigned-bookings/reschedule/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newDate: newDate.toISOString().split('T')[0],
          newTime: newTime
        }),
      });
        
      const result = await response.json();
        
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule booking');
      }
        
      message.success(booking.hasBeenRescheduled 
        ? "Original request rescheduled successfully! (This overrides the therapist's rescheduling)" 
        : 'Booking rescheduled successfully!');
      // Refresh both lists
      await Promise.all([fetchBookingRequests(), fetchConfirmedBookings()]);
    } catch (error: any) {
      console.error('Error rescheduling booking:', error);
      message.error(error.message || 'Failed to reschedule booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Show booking details modal
  const showBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'requests') {
      fetchBookingRequests();
    } else if (key === 'confirmed') {
      fetchConfirmedBookings();
    } else if (key === 'cancelled') {
      fetchCancelledBookings();
    }
  };

  // Initial data loading
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchBookingRequests();
    } else if (activeTab === 'confirmed') {
      fetchConfirmedBookings();
    } else if (activeTab === 'cancelled') {
      fetchCancelledBookings();
    }
  }, [activeTab]);

  // Columns for booking requests table
  const requestsColumns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'firstName'],
      key: 'customer',
      render: (_: any, record: Booking) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName ? `${record.customer.firstName} ${record.customer.lastName || ''}` : (record.customer.name || 'N/A')}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <MailOutlined /> {record.customer.email}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <PhoneOutlined /> {record.customer.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.service.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.service.duration} mins • {formatCurrency(record.service.price, record.service.business?.address?.country || 'default')}
          </div>
        </div>
      ),
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.therapist.fullName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.therapist.professionalTitle}
          </div>
          {record.assignedByAdmin && (
            <div style={{ fontSize: '11px', color: '#1890ff', fontWeight: 'bold', marginTop: '2px' }}>
              <UserOutlined /> Assigned by Admin
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: Booking) => (
        <div>
          <div><CalendarOutlined /> {new Date(record.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.time}
          </div>
          {record.hasBeenRescheduled && record.currentDate && record.currentTime && (
            <div style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px' }}>
              <SyncOutlined /> Rescheduled to: {new Date(record.currentDate).toLocaleDateString()} at {record.currentTime}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Request Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: Booking) => (
        <div>
          {record.hasBeenRescheduled ? (
            <div>
              <Tag icon={<ClockCircleOutlined />} color="orange">
                Original Request
              </Tag>
              <Tag icon={<SyncOutlined />} color="gold" style={{ marginLeft: 8 }}>
                Rescheduled
              </Tag>
            </div>
          ) : record.status === 'rescheduled' ? (
            <Tag icon={<SyncOutlined />} color="gold">
              Rescheduled
            </Tag>
          ) : record.status === 'pending' ? (
            <Tag icon={<ClockCircleOutlined />} color="orange">
              Pending Approval
            </Tag>
          ) : record.status === 'therapist_confirmed' ? (
            <Tag icon={<CheckCircleOutlined />} color="blue">
              Therapist Confirmed
            </Tag>
          ) : record.status === 'therapist_rejected' ? (
            <Tag icon={<CloseCircleOutlined />} color="red">
              Therapist Rejected
            </Tag>
          ) : (
            <Tag icon={<ClockCircleOutlined />} color="orange">
              {record.status.replace(/_/g, ' ').charAt(0).toUpperCase() + record.status.slice(1).replace(/_/g, ' ').slice(1)}
            </Tag>
          )}
          {record.assignedByAdmin && (
            <Tag icon={<UserOutlined />} color="blue" style={{ marginLeft: 8 }}>
              Assigned to Therapist
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => {
        // Check if booking has already been processed with one of these actions
        const isProcessed = 
          record.status === 'confirmed' || 
          record.status === 'cancelled' || 
          record.status === 'rescheduled' ||
          record.status === 'therapist_confirmed' ||
          record.status === 'therapist_rejected';
        
        return (
          <Space>
            {isProcessed ? (
              // Only show View Details for processed bookings
              <Button 
                type="link" 
                size="small"
                onClick={() => showBookingDetails(record)}
              >
                View Details
              </Button>
            ) : (
              // Show all action buttons for pending bookings
              <>
                <Button 
                  type="primary" 
                  size="small"
                  loading={actionLoading === record.id}
                  onClick={() => handleConfirmBooking(record.id)}
                >
                  {record.hasBeenRescheduled ? 'Confirm Original Request' : 'Confirm Request'}
                </Button>
                {!shouldRestrictReschedule(record.date, record.time, 'business') && (
                  <Button 
                    type="default"
                    size="small"
                    loading={actionLoading === record.id}
                    onClick={() => handleRescheduleBooking(record)}
                  >
                    {record.hasBeenRescheduled ? 'Reschedule Original' : 'Reschedule'}
                  </Button>
                )}
                <Button 
                  danger 
                  size="small"
                  loading={actionLoading === record.id}
                  onClick={() => {
                    confirm({
                      title: record.hasBeenRescheduled ? 'Cancel Original Request' : 'Cancel Booking',
                      content: record.hasBeenRescheduled 
                        ? 'Are you sure you want to cancel this original customer request? (This will override the therapist\'s rescheduling)'
                        : 'Are you sure you want to cancel this booking request?',
                      onOk: () => handleCancelBooking(record.id),
                    });
                  }}
                >
                  {record.hasBeenRescheduled ? 'Cancel Original' : 'Cancel'}
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => showBookingDetails(record)}
                >
                  View Details
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // Columns for confirmed bookings table
  const confirmedColumns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'firstName'],
      key: 'customer',
      render: (_: any, record: Booking) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName ? `${record.customer.firstName} ${record.customer.lastName || ''}` : (record.customer.name || 'N/A')}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <MailOutlined /> {record.customer.email}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <PhoneOutlined /> {record.customer.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.service.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.service.duration} mins • {formatCurrency(record.service.price, record.service.business?.address?.country || 'default')}
          </div>
        </div>
      ),
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.therapist.fullName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.therapist.professionalTitle}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: Booking) => (
        <div>
          <div><CalendarOutlined /> {new Date(record.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.time}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={status === 'confirmed' ? 'green' : 
                 status === 'paid' ? 'green' : 
                 status === 'completed' ? 'geekblue' : 
                 'default'}
          icon={status === 'confirmed' || status === 'paid' ? <CheckCircleOutlined /> :
                status === 'completed' ? <CheckCircleOutlined /> : undefined}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => showBookingDetails(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  // Columns for cancelled bookings table (therapist cancellations awaiting business approval)
  const cancelledColumns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'firstName'],
      key: 'customer',
      render: (_: any, record: Booking) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName ? `${record.customer.firstName} ${record.customer.lastName || ''}` : (record.customer.name || 'N/A')}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <MailOutlined /> {record.customer.email}
          </div>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.service.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.service.duration} mins • {formatCurrency(record.service.price, record.service.business?.address?.country || 'default')}
          </div>
        </div>
      ),
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.therapist.fullName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.therapist.professionalTitle}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: Booking) => (
        <div>
          <div><CalendarOutlined /> {new Date(record.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.time}
          </div>
        </div>
      ),
    },
    {
      title: 'Cancel Reason',
      dataIndex: 'therapistCancelReason',
      key: 'therapistCancelReason',
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
          {text || 'Not provided'}
        </Text>
      ),
    },
    {
      title: 'Refund Amount',
      key: 'advancePaid',
      render: (_: any, record: Booking) => (
        <div>
          <Tag color="orange">{formatCurrency(record.advancePaid || 0, record.service.business?.address?.country || 'default')}</Tag>
          <div style={{ fontSize: '11px', color: '#888' }}>50% of advance</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Booking) => (
        <Tag 
          color="red"
          icon={<CloseCircleOutlined />}
        >
          {record.businessReviewStatus === 'pending' ? 'Pending Approval' : 
           record.businessReviewStatus === 'approved' ? 'Approved' : 'Rejected'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space orientation="vertical" size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => showBookingDetails(record)}
          >
            View Details
          </Button>
          <Button 
            type="primary" 
            size="small"
            danger
            onClick={() => showCancelModal(record)}
            loading={actionLoading === record.id}
          >
            Cancel Booking
          </Button>
          {record.businessReviewStatus === 'pending' && (
            <>
              <Button 
                type="primary" 
                size="small"
                danger
                onClick={() => handleApproveCancellation(record.id)}
                loading={actionLoading === record.id}
              >
                Approve & Refund
              </Button>
              <Button 
                size="small"
                onClick={() => handleRejectCancellation(record.id)}
                loading={actionLoading === record.id}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Booking Management</Title>
      <Text type="secondary">
        View and manage your booking requests and confirmed appointments
      </Text>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'requests',
            label: (
              <span>
                <ClockCircleOutlined />
                Booking Requests ({bookingRequests.length})
              </span>
            ),
            children: (
              <Card style={{ marginTop: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading booking requests...</Text>
                    </div>
                  </div>
                ) : bookingRequests.length > 0 ? (
                  <Table
                    dataSource={bookingRequests}
                    columns={requestsColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} requests`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <ClockCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>No Booking Requests</Title>
                    <Text type="secondary">
                      You don't have any pending booking requests at the moment.
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'confirmed',
            label: (
              <span>
                <CheckCircleOutlined />
                Confirmed Bookings ({confirmedBookings.length})
              </span>
            ),
            children: (
              <Card style={{ marginTop: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading confirmed bookings...</Text>
                    </div>
                  </div>
                ) : confirmedBookings.length > 0 ? (
                  <Table
                    dataSource={confirmedBookings}
                    columns={confirmedColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} bookings`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>No Confirmed Bookings</Title>
                    <Text type="secondary">
                      You don't have any confirmed bookings yet.
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'cancelled',
            label: (
              <span>
                <CloseCircleOutlined />
                Cancelled Bookings ({cancelledBookings.length})
              </span>
            ),
            children: (
              <Card style={{ marginTop: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading cancelled bookings...</Text>
                    </div>
                  </div>
                ) : cancelledBookings.length > 0 ? (
                  <Table
                    dataSource={cancelledBookings}
                    columns={cancelledColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} cancellations`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <CloseCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>No Cancelled Bookings</Title>
                    <Text type="secondary">
                      You don't have any therapist cancellation requests at the moment.
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedBooking && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Booking ID">
              {selectedBooking.displayId || selectedBooking.id}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Name">
              {selectedBooking.customer.firstName 
                ? `${selectedBooking.customer.firstName} ${selectedBooking.customer.lastName || ''}`
                : (selectedBooking.customer.name || 'N/A')}
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
            <Descriptions.Item label="Service Price">
              {formatCurrency(selectedBooking.service.price, selectedBooking.service.business?.address?.country || 'default')}
            </Descriptions.Item>
            <Descriptions.Item label="Service Duration">
              {selectedBooking.service.duration} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Therapist">
              {selectedBooking.therapist.fullName} ({selectedBooking.therapist.professionalTitle})
            </Descriptions.Item>
            <Descriptions.Item label="Booking Date">
              {new Date(selectedBooking.date).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Booking Time">
              {selectedBooking.time}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag 
                color={selectedBooking.status === 'pending' ? 'orange' : 
                       selectedBooking.status === 'therapist_confirmed' ? 'blue' :
                       selectedBooking.status === 'therapist_rejected' ? 'red' :
                       selectedBooking.status === 'confirmed' ? 'green' :
                       selectedBooking.status === 'paid' ? 'green' :
                       selectedBooking.status === 'completed' ? 'geekblue' :
                       selectedBooking.status === 'cancelled' ? 'red' :
                       selectedBooking.status === 'no-show' ? 'volcano' :
                       selectedBooking.status === 'rescheduled' ? 'gold' : 'default'}
                icon={selectedBooking.status === 'pending' ? <ClockCircleOutlined /> :
                      selectedBooking.status === 'therapist_confirmed' ? <CheckCircleOutlined /> :
                      selectedBooking.status === 'therapist_rejected' ? <CloseCircleOutlined /> :
                      selectedBooking.status === 'confirmed' ? <CheckCircleOutlined /> :
                      selectedBooking.status === 'paid' ? <CheckCircleOutlined /> :
                      selectedBooking.status === 'completed' ? <CheckCircleOutlined /> :
                      selectedBooking.status === 'cancelled' ? <CloseCircleOutlined /> :
                      selectedBooking.status === 'no-show' ? <CloseCircleOutlined /> :
                      selectedBooking.status === 'rescheduled' ? <SyncOutlined /> : undefined}
              >
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace(/_/g, ' ')}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.notes && (
              <Descriptions.Item label="Notes">
                {selectedBooking.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Business Cancellation Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setSelectedBooking(null);
          setCancelReason('');
        }}
        onOk={handleBusinessCancellation}
        confirmLoading={cancellingBookingId !== null}
        okText="Cancel & Refund"
        cancelText="Back"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Booking Details</Title>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Booking ID">
              {selectedBooking?.displayId || selectedBooking?.id}
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              {selectedBooking?.customer.firstName 
                ? `${selectedBooking.customer.firstName} ${selectedBooking.customer.lastName || ''}`
                : (selectedBooking?.customer.name || 'N/A')}
            </Descriptions.Item>
            <Descriptions.Item label="Service">
              {selectedBooking?.service.name}
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">
              {selectedBooking?.date && new Date(selectedBooking.date).toLocaleDateString()} at {selectedBooking?.time}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {formatCurrency(selectedBooking?.service.price || 0, selectedBooking?.service.business?.address?.country || 'default')}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '4px', marginBottom: 16 }}>
          <Text type="warning" strong>⚠️ Important:</Text>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Cancelling this booking will notify the customer and process a 50% refund of the advance payment.
            </Text>
          </div>
        </div>

        <Form layout="vertical">
          <Form.Item
            label={<span><strong>Cancellation Reason</strong> <span style={{ color: 'red' }}>*</span></span>}
            required
          >
            <Input.TextArea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this booking (this will be sent to the customer)"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookingManagement;