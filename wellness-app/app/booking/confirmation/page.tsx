'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Alert } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const bookingId = searchParams.get('id');
  const serviceId = searchParams.get('serviceId');
  const therapistId = searchParams.get('therapistId');
  const dateParam = searchParams.get('date');
  const time = searchParams.get('time');
  
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (!bookingId || !serviceId || !therapistId || !dateParam || !time) {
      setError('Missing required booking parameters');
      setLoading(false);
      return;
    }
    
    // In a real implementation, you would fetch the booking details from the API
    // For now, we'll just set the booking details from the parameters
    setBookingDetails({
      id: bookingId,
      serviceId,
      therapistId,
      date: dateParam,
      time,
    });
    setLoading(false);
  }, [bookingId, serviceId, therapistId, dateParam, time]);
  
  const handleBackToDashboard = () => {
    router.push('/dashboard/customer');
  };
  
  const handleViewBooking = () => {
    router.push('/dashboard/customer/bookings');
  };
  
  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
            <Alert
              message="Booking Confirmation Error"
              description={error}
              type="error"
              showIcon
            />
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button type="primary" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </Layout.Content>
      </Layout>
    );
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24, color: '#52c41a' }}>
            Booking Confirmed!
          </Title>
          
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: 16 }}>✅</div>
              <Title level={3} style={{ color: '#52c41a' }}>Your appointment has been booked</Title>
              <Text>Your booking confirmation number is <strong>{bookingId}</strong></Text>
            </div>
          </Card>
          
          {bookingDetails && (
            <Card title="Booking Details" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>Date:</Text> <Text>{moment(bookingDetails.date).format('MMMM DD, YYYY')}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>Time:</Text> <Text>{bookingDetails.time}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>Service ID:</Text> <Text>{bookingDetails.serviceId}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>Therapist ID:</Text> <Text>{bookingDetails.therapistId}</Text>
                </Col>
              </Row>
            </Card>
          )}
          
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button 
              type="primary" 
              size="large" 
              style={{ margin: '0 8px' }}
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </Button>
            <Button 
              size="large" 
              style={{ margin: '0 8px' }}
              onClick={handleViewBooking}
            >
              View My Bookings
            </Button>
          </div>
        </div>
      </Layout.Content>
    </Layout>
  );
}