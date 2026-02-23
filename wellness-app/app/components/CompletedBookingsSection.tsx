'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Tag, 
  Space, 
  Empty, 
  Spin,
  message
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  StarOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import ReviewModal from '@/app/components/ReviewModal';

interface CompletedBooking {
  id: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  completedAt: string;
  notes?: string;
  duration?: number;
  reviewSubmitted: boolean;
  service: {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    category: string;
  };
  therapist: {
    id: string;
    name: string;
  };
}

const CompletedBookingsSection = () => {
  const [bookings, setBookings] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      const response = await fetch('/api/bookings/completed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch completed bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
      message.error('Failed to load completed bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setReviewModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'completed': return 'processing';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Assuming timeString is in HH:MM format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <Card 
        title={
          <Space>
            <CheckCircleOutlined />
            <span>Completed Bookings</span>
          </Space>
        }
        extra={
          <Link href="/dashboard/customer/bookings">
            <Button type="link">View All Bookings</Button>
          </Link>
        }
        style={{ marginBottom: '24px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading completed bookings...</div>
          </div>
        ) : bookings.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {bookings.map((booking) => (
              <Card 
                key={booking.id}
                hoverable
                style={{ 
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px', 
                    fontWeight: 600,
                    color: '#1d1d1d'
                  }}>
                    {booking.service.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <UserOutlined style={{ marginRight: '8px' }} />
                    {booking.therapist.name}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Space vertical size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarOutlined style={{ 
                        marginRight: '8px', 
                        color: '#1890ff' 
                      }} />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <ClockCircleOutlined style={{ 
                        marginRight: '8px', 
                        color: '#52c41a' 
                      }} />
                      <span>{formatTime(booking.time)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <DollarOutlined style={{ 
                        marginRight: '8px', 
                        color: '#fa8c16' 
                      }} />
                      <span>${booking.service.price.toFixed(2)}</span>
                    </div>
                  </Space>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Tag color={getStatusColor(booking.paymentStatus)}>
                    {booking.paymentStatus.toUpperCase()}
                  </Tag>
                  
                  {booking.reviewSubmitted ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Review Submitted
                    </Tag>
                  ) : (
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => handleWriteReview(booking)}
                    >
                      Write Review
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty 
            description="No completed bookings yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link href="/search">
              <Button type="primary">
                Book a Service
              </Button>
            </Link>
          </Empty>
        )}
      </Card>

      <ReviewModal
        visible={reviewModalVisible}
        bookingId={selectedBooking?.id}
        serviceName={selectedBooking?.service.name}
        therapistName={selectedBooking?.therapist.name}
        bookingDate={selectedBooking?.date}
        bookingTime={selectedBooking?.time}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedBooking(null);
        }}
        onSuccess={() => {
          // Refresh the bookings list
          fetchCompletedBookings();
          setReviewModalVisible(false);
          setSelectedBooking(null);
        }}
      />
    </div>
  );
};

export default CompletedBookingsSection;