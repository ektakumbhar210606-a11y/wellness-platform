'use client';

import { useState, useEffect, Suspense } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Alert, Spin } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment';
import { formatBookingId } from '../../../utils/bookingIdFormatter';

const { Title, Text } = Typography;

function BookingConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const bookingId = searchParams.get('id');
  const businessId = searchParams.get('businessId');
  const serviceId = searchParams.get('serviceId');
  const therapistId = searchParams.get('therapistId');
  const dateParam = searchParams.get('date');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (!serviceId || !therapistId || !dateParam || !startTime || !endTime) {
      setError('Missing required booking parameters');
      setLoading(false);
      return;
    }
    
    // In a real implementation, you would fetch the booking details from the API
    // For now, we'll just set the booking details from the parameters
    setBookingDetails({
      id: bookingId || 'temp-id',
      displayId: bookingId ? formatBookingId(bookingId) : '', // Use actual display ID formatter
      businessId,
      serviceId,
      therapistId,
      date: dateParam,
      time: `${startTime} - ${endTime}`,
    });
    setLoading(false);
  }, [bookingId, businessId, serviceId, therapistId, dateParam, startTime, endTime]);
  
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
              <Text>Your booking confirmation number is <strong>{bookingId || 'TEMP-' + Date.now()}</strong></Text>
              {bookingId && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Display ID: {formatBookingId(bookingId)}
                </Text>
              )}
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
                  <Text strong>Booking ID:</Text> <Text>{bookingDetails.displayId || bookingDetails.id}</Text>
                </Col>
                {bookingDetails.businessId && (
                  <Col span={24}>
                    <Text strong>Business ID:</Text> <Text>{bookingDetails.businessId}</Text>
                  </Col>
                )}
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

export default function BookingConfirmationPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /><Text style={{ display: 'block', marginTop: 16 }}>Loading...</Text></div>}>
            <BookingConfirmation />
        </Suspense>
    )
}
