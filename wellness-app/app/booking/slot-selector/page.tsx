'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Spin, Alert, message, DatePicker } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

export default function BookingSlotSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const businessId = searchParams.get('businessId');
  const serviceId = searchParams.get('serviceId');
  const therapistId = searchParams.get('therapistId');
  
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  // Define type for selected slot
  type SelectedSlotType = {
    id?: string;
    startTime: string;
    endTime: string;
    date: string;
  } | null;
  
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotType>(null);
  
  // Function to validate date selection (30 days in advance max)
  const disabledDate = (current: any) => {
    if (!current) return false;
    
    // Convert current to moment if it's a dayjs object
    const currentDate = current.$d ? moment(current.$d) : moment(current);
    const today = moment().startOf('day');
    const maxDate = moment().add(30, 'days').endOf('day');
    
    // Disable dates before today or after max date
    return currentDate.isBefore(today, 'day') || currentDate.isAfter(maxDate, 'day');
  };
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (!businessId || !serviceId || !therapistId) {
      setError('Missing required parameters: businessId, serviceId, or therapistId');
      setLoading(false);
      return;
    }
    
    // Only fetch slots when a date is selected
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [businessId, serviceId, therapistId, selectedDate]);
  
  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate that a date has been selected
      if (!selectedDate) {
        throw new Error('Please select a date first');
      }
      
      // Get the token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Format the selected date as YYYY-MM-DD
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      
      // Fetch available slots from the newer API with date support
      const response = await fetch(`/api/bookings/available-slots?businessId=${businessId}&serviceId=${serviceId}&therapistId=${therapistId}&date=${formattedDate}`, {
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
        // Filter out only available slots and format them
        const filteredSlots = result.data
          .filter((slot: any) => slot.isAvailable)
          .map((slot: any, index: number) => ({
            id: `slot-${index}-${formattedDate}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            date: formattedDate
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
    
    // Navigate to booking confirmation page
    // Pass: businessId, serviceId, therapistId, selectedSlot
    router.push(`/booking/confirmation?businessId=${businessId}&serviceId=${serviceId}&therapistId=${therapistId}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}&date=${selectedSlot.date}`);
  };
  
  if (!businessId || !serviceId || !therapistId) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
            <Alert
              title="Missing Parameters"
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
            Select Date and Time Slot
          </Title>
          
          {error && (
            <Alert
              title="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* Date Selection Section */}
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 12 }}>Select Date</Title>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <DatePicker
                value={selectedDate}
                onChange={(date) => {
                  // Use Day.js object directly
                  setSelectedDate(date);
                  // Reset selected slot when date changes
                  setSelectedSlot(null);
                }}
                disabledDate={disabledDate}
                placeholder="Select a date"
                style={{ width: '100%', maxWidth: '300px' }}
              />
            </div>
          </div>
          
          {/* Show message when no date is selected */}
          {!selectedDate && (
            <Alert
              title="Date Required"
              description="Please select a date to view available time slots"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          {/* Loading state */}
          {loading && selectedDate && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16 }}>Loading available time slots for {selectedDate.format('MMMM D, YYYY')}...</Text>
            </div>
          )}
          
          {/* Slot selection section - only show when date is selected */}
          {selectedDate && !loading && (
            <>
              <Title level={4} style={{ marginBottom: 16 }}>Available Time Slots for {selectedDate.format('MMMM D, YYYY')}</Title>
              
              <Row gutter={[16, 16]}>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => {
                    const currentTime = moment();
                    const slotTime = moment(slot.startTime, 'HH:mm');
                    
                    // For date-specific slots, we don't need to check if it's in the past
                    // since the user selected the date
                    const isPast = false;
                    
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
                      title="No Available Slots"
                      description={`There are currently no available time slots for ${selectedDate.format('MMMM D, YYYY')}. Please select another date.`}
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