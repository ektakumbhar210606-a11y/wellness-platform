import React from 'react';
import { Card, Button, Typography, Tag, Space } from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  ShopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Appointment {
  id: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  } | null;
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  } | null;
  business: {
    id: string;
    name: string;
  } | null;
  date: Date;
  time: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerUpcomingAppointmentCardProps {
  appointment: Appointment;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const CustomerUpcomingAppointmentCard: React.FC<CustomerUpcomingAppointmentCardProps> = ({ 
  appointment, 
  onReschedule,
  onCancel 
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'confirmed': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      case 'no-show': return 'gray';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card 
      style={{ marginBottom: 16 }}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              {appointment.service?.name || 'Service Name'}
            </Title>
            <Tag color={getStatusColor(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Tag>
          </div>
          
          <Space orientation="vertical" size={4}>
            {appointment.therapist && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                <Text type="secondary">
                  with {appointment.therapist.fullName}
                </Text>
                {appointment.therapist.professionalTitle && (
                  <Text type="secondary">({appointment.therapist.professionalTitle})</Text>
                )}
              </div>
            )}
            
            {appointment.business && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShopOutlined />
                <Text type="secondary">{appointment.business.name}</Text>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined />
              <Text type="secondary">
                {formatDate(appointment.date)} at {formatTime(appointment.time)}
              </Text>
            </div>
            
            {appointment.service && (
              <Text type="secondary">
                Duration: {appointment.service.duration} mins • ${appointment.service.price}
              </Text>
            )}
          </Space>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointment.status.toLowerCase() === 'confirmed' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => onReschedule?.(appointment.id)}
            >
              Reschedule
            </Button>
          )}
          {appointment.status.toLowerCase() !== 'completed' && 
           appointment.status.toLowerCase() !== 'cancelled' && (
            <Button 
              size="small"
              onClick={() => onCancel?.(appointment.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CustomerUpcomingAppointmentCard;