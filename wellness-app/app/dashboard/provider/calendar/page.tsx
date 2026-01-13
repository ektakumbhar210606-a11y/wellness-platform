'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, message, Divider } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import WeeklyAvailability from '@/app/components/Availability/WeeklyAvailability';

const { Title, Text } = Typography;

const ProviderCalendarPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      router.push('/dashboard');
      return;
    }

    // Simulate loading availability data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [isAuthenticated, user, router]);

  const handleAvailabilityChange = (newAvailability: any[]) => {
    setAvailability(newAvailability);
    message.success('Availability updated successfully!');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <CalendarOutlined /> Business Calendar
        </Title>
        <Text>Manage your business hours and availability</Text>
      </div>

      <Card title="Weekly Availability" style={{ marginBottom: '24px' }}>
        <WeeklyAvailability 
          onChange={handleAvailabilityChange}
          initialAvailability={availability}
        />
      </Card>

      <Card title="Upcoming Appointments" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <ClockCircleOutlined style={{ fontSize: '48px', color: '#667eea', marginBottom: '16px' }} />
          <Title level={4} style={{ marginBottom: '8px' }}>No upcoming appointments</Title>
          <Text type="secondary">Your upcoming appointments will appear here</Text>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <Button onClick={() => router.back()}>Back to Dashboard</Button>
        <Button type="primary">Save Changes</Button>
      </div>
    </div>
  );
};

export default ProviderCalendarPage;