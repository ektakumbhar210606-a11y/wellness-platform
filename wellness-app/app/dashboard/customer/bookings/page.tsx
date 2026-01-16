'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Table, Tag, Space, Typography, Modal } from 'antd';
import { useAuth } from '@/app/context/AuthContext';

const { Title, Text } = Typography;

const CustomerBookingsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || user.role.toLowerCase() !== 'customer') {
        router.push('/');
        return;
      }

      // In a real app, you would fetch customer bookings
      // For now, we'll simulate booking data
      const mockBookings = [
        {
          id: 'BK001',
          serviceName: 'Swedish Massage',
          therapist: 'Sarah Johnson',
          date: '2026-01-20',
          time: '14:00',
          duration: '60 mins',
          status: 'confirmed',
          price: '$85',
        },
        {
          id: 'BK002',
          serviceName: 'Deep Tissue Session',
          therapist: 'Michael Chen',
          date: '2026-01-25',
          time: '10:00',
          duration: '90 mins',
          status: 'confirmed',
          price: '$120',
        },
        {
          id: 'BK003',
          serviceName: 'Aromatherapy Facial',
          therapist: 'Emma Rodriguez',
          date: '2026-01-15',
          time: '16:30',
          duration: '75 mins',
          status: 'completed',
          price: '$95',
        },
        {
          id: 'BK004',
          serviceName: 'Hot Stone Therapy',
          therapist: 'David Wilson',
          date: '2026-01-10',
          time: '11:00',
          duration: '90 mins',
          status: 'completed',
          price: '$110',
        },
      ];
      
      setBookings(mockBookings);
      setLoading(false);
    };

    checkAccess();
  }, [user, router]);

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'Therapist',
      dataIndex: 'therapist',
      key: 'therapist',
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (record: any) => `${record.date} at ${record.time}`,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'cancelled') color = 'red';
        if (status === 'pending') color = 'orange';
        
        return (
          <Tag color={color} style={{ textTransform: 'capitalize' }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: any) => (
        <Space size="middle">
          {record.status === 'confirmed' && (
            <>
              <Button 
                type="link" 
                onClick={() => {
                  setBookingToCancel(record);
                  setCancelModalVisible(true);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="link"
                onClick={() => router.push(`/bookings/${record.id}/reschedule`)}
              >
                Reschedule
              </Button>
            </>
          )}
          <Button 
            type="link"
            onClick={() => router.push(`/bookings/${record.id}/details`)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const handleCancelBooking = () => {
    // In a real app, you would call the API to cancel the booking
    // await api.delete(`/api/bookings/${bookingToCancel.id}/cancel`);
    
    // Update local state to reflect cancellation
    setBookings(bookings.map(booking => 
      booking.id === bookingToCancel.id 
        ? { ...booking, status: 'cancelled' } 
        : booking
    ));
    
    setCancelModalVisible(false);
    setBookingToCancel(null);
  };

  if (!user || user.role.toLowerCase() !== 'customer') {
    return null; // Or render a redirect message
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>My Bookings</Title>
      <Text>View and manage your appointments</Text>
      
      <Card style={{ marginTop: 24 }}>
        <Table 
          columns={columns} 
          dataSource={bookings} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Confirm Cancellation"
        open={cancelModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setCancelModalVisible(false)}
        okText="Yes, Cancel"
        cancelText="No, Keep Booking"
      >
        <p>Are you sure you want to cancel the booking for <strong>{bookingToCancel?.serviceName}</strong> on {bookingToCancel?.date} at {bookingToCancel?.time}?</p>
        <p>Please note that cancellation policies may apply depending on how far in advance you cancel.</p>
      </Modal>
    </div>
  );
};

export default CustomerBookingsPage;