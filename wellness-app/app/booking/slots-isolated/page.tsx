'use client';

import { useState, useEffect, Suspense } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Spin, Alert, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;

function BookingSlots() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const businessId = searchParams.get('businessId');
  const serviceId = searchParams.get('serviceId');
  const therapistId = searchParams.get('therapistId');
  
  // Define type for selected slot
  type SelectedSlotType = {
    id?: string;
    startTime: string;
    endTime: string;
    date: string;
  } | null;
  
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotType>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (!businessId || !serviceId || !therapistId) {
      setError('Missing required parameters: businessId, serviceId, or therapistId');
      setLoading(false);
      return;
    }
    
    fetchAvailableSlots();
  }, [businessId, serviceId, therapistId]);
  
  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch available slots from the new booking slots API
      const response = await fetch(`/api/booking/slots?businessId=${businessId}&serviceId=${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch available slots');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Filter out past slots and format the slots
        const today = new Date();
        const todayFormatted = moment(today).format('YYYY-MM-DD');
        
        const filteredSlots = result.data
          .filter((slot: any) => {
            // For this implementation, we're assuming the API returns slots for today
            // In a real implementation, you might have dates associated with each slot
            return true; // Placeholder - in a real scenario, you'd filter past times
          })
          .map((slot: any, index: number) => ({
            id: `slot-${index}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            // In a real implementation, you'd include date information
            date: todayFormatted
          }));
        
        setAvailableSlots(filteredSlots);
      } else {
        throw new Error(result.error || 'Failed to fetch available slots');
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSlotSelect = (slot: any) => {
    // Check if the slot is in the past (future-proofing)
    const currentTime = moment();
    const slotTime = moment(slot.startTime, 'HH:mm');
    
    // If the slot time is before the current time, it's in the past
    if (slotTime.isBefore(currentTime, 'minute')) {
      message.warning('Cannot select past time slots');
      return;
    }
    
    setSelectedSlot(slot);
  };
  
  const handleConfirmSelection = () => {
    if (!selectedSlot) {
      message.warning('Please select a time slot first');
      return;
    }
    
    // Validate slot selection
    if (!businessId || !serviceId || !therapistId) {
      message.error('Missing required booking parameters');
      return;
    }
    
    // Navigate to next booking confirmation/payment page
    // Pass: businessId, serviceId, therapistId, selectedSlot
    router.push(`/booking/confirm-selection?businessId=${businessId}&serviceId=${serviceId}&therapistId=${therapistId}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}&date=${selectedSlot.date}`);
  };
  
  if (!businessId || !serviceId || !therapistId) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
            <Alert
              message="Missing Parameters"
              description="Business ID, Service ID, and Therapist ID are required to view booking slots."
              type="error"
              showIcon
            />
          </div>
        </Layout.Content>
      </Layout>
    );
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            Select a Time Slot
          </Title>
          
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16 }}>Loading available time slots...</Text>
            </div>
          ) : (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>Available Time Slots</Title>
              
              <Row gutter={[16, 16]}>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => {
                    const currentTime = moment();
                    const slotTime = moment(slot.startTime, 'HH:mm');
                    const isPast = slotTime.isBefore(currentTime, 'minute');
                    
                    return (
                      <Col key={slot.id} xs={24} sm={12} md={8}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 8,
                            border: selectedSlot?.id === slot.id ? '2px solid #1890ff' : 
                                     isPast ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                            backgroundColor: selectedSlot?.id === slot.id ? '#e6f7ff' : 
                                           isPast ? '#fff2f0' : '#ffffff',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.6 : 1
                          }}
                          onClick={() => !isPast && handleSlotSelect(slot)}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                              {slot.date}
                            </div>
                          </div>
                        </Card>
                      </Col>
                    );
                  })
                ) : (
                  <Col span={24}>
                    <Alert
                      message="No Available Slots"
                      description="There are currently no available time slots for this service. Please check back later."
                      type="info"
                      showIcon
                    />
                  </Col>
                )}
              </Row>
              
              {selectedSlot && (
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Text>Selected slot: {selectedSlot.date} from {selectedSlot.startTime} to {selectedSlot.endTime}</Text>
                  <div style={{ marginTop: 16 }}>
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={handleConfirmSelection}
                    >
                      Confirm Slot
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout.Content>
    </Layout>
  );
}

export default function IsolatedBookingSlotsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /><Text style={{ display: 'block', marginTop: 16 }}>Loading...</Text></div>}>
      <BookingSlots />
    </Suspense>
  );
}
