'use client';

import React from 'react';
import { Card, Button, message } from 'antd';
import BookingManagement from '@/app/components/BookingManagement';

const BookingTestPage = () => {
  const testBookingFunctionality = async () => {
    try {
      // This would normally be called after successful login
      message.success('Booking management component loaded successfully!');
    } catch (error) {
      message.error('Error testing booking functionality');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card title="Booking Management Test">
        <p>This page tests the booking management functionality that will be integrated into the provider dashboard.</p>
        <Button type="primary" onClick={testBookingFunctionality} style={{ marginBottom: '20px' }}>
          Test Booking Component
        </Button>
        
        <div style={{ marginTop: '20px' }}>
          <BookingManagement />
        </div>
      </Card>
    </div>
  );
};

export default BookingTestPage;