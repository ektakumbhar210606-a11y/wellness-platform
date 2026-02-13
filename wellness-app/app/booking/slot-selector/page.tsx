'use client';

import { useState, useEffect, Suspense } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Spin, Alert, message, DatePicker } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import moment from 'moment';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

function BookingSlotSelector() {
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
    } else {
        setLoading(false);
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
        // Include all slots (available, pending, confirmed) but track their status
        const allSlots = result.data.map((slot: any, index: number) => ({
          id: `slot-${index}-${formattedDate}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          date: formattedDate,
          isAvailable: slot.isAvailable,
          status: slot.status || 'available'  // 'available', 'pending', 'confirmed', 'rescheduled'
        }));
        
        setAvailableSlots(allSlots);
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
    // Check if the slot is in the past compared to the current date and time
    // For slots on future dates, all times should be selectable
    const currentTime = moment();
    const slotDateTime = moment(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
    
    // If the slot date/time is before the current date/time, it's in the past
    if (slotDateTime.isBefore(currentTime, 'minute')) {
      message.warning('Cannot select past time slots');
      return;
    }
    
    // Only allow selection of available slots
    if (!slot.isAvailable) {
      if (slot.status === 'pending') {
        message.warning('This time slot has a pending booking request and is temporarily unavailable.');
      } else if (slot.status === 'confirmed') {
        message.warning('This time slot is already booked.');
      } else if (slot.status === 'rescheduled') {
        message.warning('This time slot is reserved for a rescheduled booking.');
      } else {
        message.warning('This time slot is not available.');
      }
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
  
  const handleSendBookingRequest = async () => {
    if (!selectedSlot) {
      message.warning('Please select a time slot first');
      return;
    }
    
    // Validate slot selection
    if (!businessId || !serviceId || !therapistId) {
      message.error('Missing required booking parameters');
      return;
    }
    
    try {
      // Get the token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        message.error('Authentication required. Please login first.');
        return;
      }
      
      // Send booking request to the API
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          serviceId,
          therapistId,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send booking request');
      }
      
      if (result.success) {
        message.success('Booking request sent successfully! The business will review your request.');
        // Optionally clear the selected slot
        setSelectedSlot(null);
      }
    } catch (error: any) {
      console.error('Error sending booking request:', error);
      message.error(error.message || 'Failed to send booking request. Please try again.');
    }
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
                    const slotDateTime = moment(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
                    
                    // Check if the slot is in the past
                    const isPast = slotDateTime.isBefore(currentTime, 'minute');
                    
                    // Determine slot status for styling
                    const isAvailable = slot.isAvailable;
                    const slotStatus = slot.status || 'available';
                    
                    // Define styles based on slot status
                    let borderColor = '#f0f0f0'; // Default
                    let backgroundColor = '#ffffff'; // Default
                    let cursorStyle = 'pointer';
                    let opacity = 1;
                    let disabled = false;
                    
                    if (isPast) {
                      borderColor = '#ffccc7';
                      backgroundColor = '#fff2f0';
                      cursorStyle = 'not-allowed';
                      opacity = 0.6;
                      disabled = true;
                    } else if (slotStatus === 'pending') {
                      borderColor = '#ffe58f'; // Light yellow for pending
                      backgroundColor = '#fffbe6'; // Light yellow background
                      cursorStyle = 'not-allowed';
                      opacity = 0.7;
                      disabled = true;
                    } else if (slotStatus === 'confirmed') {
                      borderColor = '#ffccc7'; // Light red for confirmed
                      backgroundColor = '#fff2f0'; // Light red background
                      cursorStyle = 'not-allowed';
                      opacity = 0.7;
                      disabled = true;
                    } else if (slotStatus === 'rescheduled') {
                      borderColor = '#d9f7be'; // Light green for rescheduled
                      backgroundColor = '#f6ffed'; // Light green background
                      cursorStyle = 'not-allowed';
                      opacity = 0.7;
                      disabled = true;
                    } else if (selectedSlot?.id === slot.id) {
                      borderColor = '#1890ff'; // Blue for selected
                      backgroundColor = '#e6f7ff';
                    }
                    
                    return (
                      <Col key={slot.id} xs={24} sm={12} md={8}>
                        <Card
                          hoverable={!disabled}
                          style={{
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                            backgroundColor,
                            cursor: cursorStyle,
                            opacity,
                          }}
                          onClick={() => !disabled && handleSlotSelect(slot)}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                              {slot.date}
                            </div>
                            {!isAvailable && slotStatus !== 'available' && (
                              <div style={{ marginTop: 4, fontSize: '11px', color: '#ff4d4f', fontWeight: 'normal' }}>
                                {slotStatus.charAt(0).toUpperCase() + slotStatus.slice(1)}
                              </div>
                            )}
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
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={handleConfirmSelection}
                    >
                      Confirm Slot
                    </Button>
                    <Button 
                      type="default" 
                      size="large" 
                      onClick={handleSendBookingRequest}
                    >
                      Send Booking Request
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

export default function BookingSlotSelectorPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /><Text style={{ display: 'block', marginTop: 16 }}>Loading...</Text></div>}>
            <BookingSlotSelector />
        </Suspense>
    )
}
