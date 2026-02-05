'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Tag, Space, Typography, Modal, Skeleton, Tabs } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CustomerBookingsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
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

  useEffect(() => {
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
  }, [user, router]);

  // Columns for booking requests tab
  const requestColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
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
      render: (price: number) => `$${price || 'N/A'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'cancelled') color = 'red';
        if (status === 'pending') color = 'orange';
        if (status === 'confirmed') color = 'blue';
        if (status === 'completed') color = 'gray';
        if (status === 'rescheduled') color = 'gold';
          
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="small" wrap>
          {record.status !== 'cancelled' && (
            <>
              <Button 
                size="small"
                type="primary"
                ghost
                onClick={() => {
                  // Add confirm functionality here if needed
                  // For now, this is just a placeholder since typically customers don't confirm their own requests
                  console.log('Confirm booking:', record.id);
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
        </Space>
      ),
    },
  ];
  
  // Columns for confirmed bookings tab
  const confirmedColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
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
      render: (price: number) => `$${price || 'N/A'}`,
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
      render: (status: string) => {
        let color = 'blue';
        if (status === 'cancelled') color = 'red';
        if (status === 'pending') color = 'orange';
        if (status === 'confirmed') color = 'blue';
        if (status === 'completed') color = 'gray';
        if (status === 'rescheduled') color = 'gold';
          
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="small" wrap>
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
        </Space>
      ),
    },
  ];

  const handleCancelBooking = async () => {
    try {
      const token = localStorage.getItem('token');
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
          bookingId: bookingToCancel.id,
          status: 'cancelled'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }
      
      // Update local state to reflect cancellation
      setBookings(bookings.map(booking => 
        booking.id === bookingToCancel.id 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
      setCancelModalVisible(false);
      setBookingToCancel(null);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      // Optionally show error message to user
    }
  };

  if (!user || user.role.toLowerCase() !== 'customer') {
    return null; // Or render a redirect message
  }

  // Filter bookings based on active tab
  const bookingRequests = bookings.filter(booking => booking.status !== 'confirmed');
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');

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
    </div>
  );
};

export default CustomerBookingsPage;