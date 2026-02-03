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
  Descriptions
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Booking {
  id: string;
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
  };
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  };
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}

interface BookingManagementProps {
  businessId?: string;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch booking requests (pending bookings)
  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/business?status=pending`, {
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

  // Handle booking confirmation
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/business`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          status: 'confirmed'
        }),
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

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/business`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          status: 'cancelled'
        }),
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
      const newTime = booking.time || '10:00';
      
      const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
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
      
      message.success('Booking rescheduled successfully!');
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
    }
  };

  // Initial data loading
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchBookingRequests();
    } else if (activeTab === 'confirmed') {
      fetchConfirmedBookings();
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
            {record.service.duration} mins • ${record.service.price}
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
        <Tag icon={<ClockCircleOutlined />} color="orange">
          Pending Approval
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            loading={actionLoading === record.id}
            onClick={() => handleConfirmBooking(record.id)}
          >
            Confirm
          </Button>
          <Button 
            type="default"
            size="small"
            loading={actionLoading === record.id}
            onClick={() => handleRescheduleBooking(record)}
          >
            Reschedule
          </Button>
          <Button 
            danger 
            size="small"
            loading={actionLoading === record.id}
            onClick={() => {
              confirm({
                title: 'Cancel Booking',
                content: 'Are you sure you want to cancel this booking request?',
                onOk: () => handleCancelBooking(record.id),
              });
            }}
          >
            Cancel
          </Button>
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
            {record.service.duration} mins • ${record.service.price}
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
        <Tag icon={<CheckCircleOutlined />} color="green">
          Confirmed
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
              ${selectedBooking.service.price}
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
                       selectedBooking.status === 'confirmed' ? 'green' : 
                       selectedBooking.status === 'cancelled' ? 'red' : 'default'}
                icon={selectedBooking.status === 'pending' ? <ClockCircleOutlined /> :
                      selectedBooking.status === 'confirmed' ? <CheckCircleOutlined /> :
                      selectedBooking.status === 'cancelled' ? <CloseCircleOutlined /> : undefined}
              >
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
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
    </div>
  );
};

export default BookingManagement;