import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Modal, Select, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CheckOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons';
import './TherapistRequestCard.css';

const { Title, Text } = Typography;

interface BookingOption {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
}

interface TherapistRequestProps {
  request: {
    id: string;
    therapistId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    bio?: string;
    specialties?: string[];
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    approvedAt?: string;
    professionalTitle?: string | object;
    certifications?: string[] | object[];
    licenseNumber?: string | object;
    location?: string | { city?: string; state?: string; country?: string; };
    availability?: string | object;
    experience?: number;
    skills?: string[];
    areaOfExpertise?: string[];
  };
  onApprove: (therapistId: string) => void;
  onReject: (therapistId: string) => void;
  loading?: boolean;
  onAssignTask?: (therapistId: string, bookingId: string) => void;
}
const TherapistRequestCard: React.FC<TherapistRequestProps> = ({
  request,
  onApprove,
  onReject,
  loading = false,
  onAssignTask
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const handleApprove = () => {
    onApprove(request.therapistId);
  };

  const handleReject = () => {
    onReject(request.therapistId);
  };

  const handleAssignClick = async () => {
    setLoadingBookings(true);
    try {
      // Check various possible locations for the therapist ID
      // The primary field should be therapistId, but let's also check id
      let therapistId = request.therapistId || request.id;
      
      if (!therapistId) {
        console.error('Therapist ID is required from request object:', request);
        throw new Error('Therapist ID is required');
      }
      
      // Simple validation for ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(therapistId)) {
        console.error('Invalid therapist ID format:', therapistId);
        throw new Error('Invalid therapist ID format');
      }
      
      // Log the API call details for debugging
      console.log('Making API call to:', `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/by-therapist/${therapistId}`);
      console.log('Therapist ID being used:', therapistId);
      
      // Fetch booking requests for this therapist
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/by-therapist/${therapistId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Check if the response has content before parsing JSON
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let result: { error?: string; data?: any; message?: string } = {};
      try {
        result = responseText ? JSON.parse(responseText) : { data: [] };
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        result = { error: 'Invalid response format from server' };
      }
      
      if (!response.ok) {
        console.error('API Error Response:', result);
        // Handle different error scenarios
        if (response.status === 401) {
          throw new Error(result.error || 'Unauthorized access. Please log in again.');
        } else if (response.status === 404) {
          message.info(result.error || 'No bookings found for this therapist.');
          setBookings([]); // Set empty bookings so user can still assign
          setModalVisible(true);
          return;
        } else if (response.status === 400) {
          throw new Error(result.error || 'Invalid request parameters');
        } else if (response.status === 403) {
          throw new Error(result.error || 'Access forbidden. You do not have permission to perform this action.');
        } else {
          throw new Error(result.error || `API request failed with status ${response.status}`);
        }
      }
      
      // Check if result.data exists and is an array
      if (!result.data || !Array.isArray(result.data)) {
        console.warn('No bookings data returned or invalid format:', result);
        message.info('No bookings available for assignment.');
        setBookings([]); // Allow user to still open modal but with empty list
        setModalVisible(true);
        return;
      }
      
      // Format bookings for the dropdown
      const formattedBookings = result.data.map((booking: any) => ({
        id: booking.id || booking._id,
        customerName: `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`,
        serviceName: booking.service?.name || booking.serviceName || 'Unknown Service',
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.time || 'N/A',
      })).filter((booking: BookingOption) => booking.customerName.trim() !== ' '); // Filter out bookings with empty customer names
      
      setBookings(formattedBookings);
      setModalVisible(true);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      message.error(error.message || 'Failed to load booking requests');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleAssignConfirm = async () => {
    if (!selectedBookingId) {
      message.warning('Please select a booking to assign');
      return;
    }
    
    // Validate therapistId exists
    let therapistId = request.therapistId || request.id;
    if (!therapistId) {
      message.error('Therapist ID is missing. Cannot assign booking.');
      return;
    }
    
    setAssignLoading(true);
    try {
      // Call the onAssignTask function passed from parent component
      if (onAssignTask) {
        await onAssignTask(therapistId, selectedBookingId);
        setModalVisible(false);
        setSelectedBookingId('');
        message.success('Booking assigned to therapist successfully!');
      }
    } catch (error: any) {
      console.error('Error assigning booking:', error);
      message.error(error.message || 'Failed to assign booking');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedBookingId('');
  };

  const getStatusTag = () => {
    switch (request.status) {
      case 'approved':
        return <Tag color="green">Approved</Tag>;
      case 'rejected':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="orange">Pending</Tag>;
    }
  };

  // Determine CSS class based on status
  const cardClassName = `therapist-request-card therapist-request-status-${request.status}`;

  return (
    <Card 
      className={cardClassName}
      style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center" size="small">
            <UserOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {request.firstName} {request.lastName}
              </Title>
              {getStatusTag()}
            </div>
          </Space>
        </div>
      }
      extra={
        request.status === 'pending' && (
          <Space>
            <Button 
              type="primary" 
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={handleReject}
              loading={loading}
              title="Reject"
            />
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              size="small"
              onClick={handleApprove}
              loading={loading}
              title="Approve"
            />
          </Space>
        )
      }
    >
      <div style={{ flex: 1 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <MailOutlined style={{ marginRight: 8, color: '#667eea' }} />
            <Text copyable={{ text: request.email }}>{request.email}</Text>
          </div>
          
          {request.phone && (
            <div>
              <PhoneOutlined style={{ marginRight: 8, color: '#667eea' }} />
              <Text copyable={{ text: request.phone }}>{request.phone}</Text>
            </div>
          )}
          
          {request.bio && (
            <div>
              <Text strong>About: </Text>
              <Text type="secondary">{request.bio.substring(0, 100)}{request.bio.length > 100 ? '...' : ''}</Text>
            </div>
          )}
          
          {request.professionalTitle && (
            <div>
              <Text strong>Title: </Text>
              <Text type="secondary">
                {typeof request.professionalTitle === 'string' 
                  ? request.professionalTitle 
                  : 'Professional title available'}
              </Text>
            </div>
          )}
          
          {request.licenseNumber && (
            <div>
              <Text strong>License: </Text>
              <Text type="secondary">
                {typeof request.licenseNumber === 'string' 
                  ? request.licenseNumber 
                  : 'License information available'}
              </Text>
            </div>
          )}
          
          {request.certifications && request.certifications.length > 0 && (
            <div>
              <Text strong>Certifications: </Text>
              <Space wrap={true}>
                {request.certifications.map((certification, index) => {
                  const certValue = typeof certification === 'string' 
                    ? certification 
                    : typeof certification === 'object' && certification !== null
                    ? JSON.stringify(certification)
                    : 'Certification';
                  return (
                    <Tag key={index} color="blue">
                      {certValue}
                    </Tag>
                  );
                })}
              </Space>
            </div>
          )}
          
          {request.location && (
            <div>
              <Text strong>Location: </Text>
              <Text type="secondary">
                {typeof request.location === 'string' 
                  ? request.location 
                  : `${request.location.city || ''} ${request.location.state || ''}`.trim() || 'N/A'}
              </Text>
            </div>
          )}
          
          {request.experience !== undefined && (
            <div>
              <Text strong>Experience: </Text>
              <Text type="secondary">{request.experience} years</Text>
            </div>
          )}
          
          {request.availability && (
            <div>
              <Text strong>Availability: </Text>
              <Text type="secondary">
                {typeof request.availability === 'string' 
                  ? request.availability 
                  : 'Availability information available'}
              </Text>
            </div>
          )}
          
          {request.skills && request.skills.length > 0 && (
            <div>
              <Text strong>Skills: </Text>
              <Space wrap={true}>
                {request.skills.map((skill, index) => (
                  <Tag key={index} color="blue">
                    {skill}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          
          {request.specialties && request.specialties.length > 0 && (
            <div>
              <Text strong>Specialties: </Text>
              <Space wrap={true}>
                {request.specialties.map((specialty, index) => (
                  <Tag key={index} color="blue">
                    {specialty}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          
          {request.areaOfExpertise && request.areaOfExpertise.length > 0 && (
            <div>
              <Text strong>Area of Expertise: </Text>
              <Space wrap={true}>
                {request.areaOfExpertise.map((expertise, index) => (
                  <Tag key={index} color="geekblue">
                    {expertise.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          
          <div>
            <Text type="secondary">
              Requested: {new Date(request.requestedAt).toLocaleDateString()}
            </Text>
          </div>
        </Space>
      </div>
      
      {request.status !== 'pending' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">
              {request.status === 'approved' 
                ? `Approved on: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}` 
                : 'Request rejected'}
            </Text>
            {request.status === 'approved' && (
              <Button type="primary" size="small" onClick={handleAssignClick}>
                Assign Task
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Modal for assigning booking to therapist */}
      <Modal
        title="Assign Booking to Therapist"
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        destroyOnHidden={true}
      >
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="booking-select" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Assign Booking
          </label>
          <Select
            id="booking-select"
            placeholder="Select a booking request"
            style={{ width: '100%' }}
            value={selectedBookingId}
            onChange={(value) => setSelectedBookingId(value)}
            loading={loadingBookings}
            disabled={loadingBookings}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {bookings.map((booking) => (
              <Select.Option key={booking.id} value={booking.id}>
                <div>
                  <strong>{booking.customerName}</strong> - {booking.serviceName} - 
                  {booking.date} at {booking.time}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleModalCancel}>Cancel</Button>
            <Button 
              type="primary" 
              onClick={handleAssignConfirm}
              loading={assignLoading}
              disabled={!selectedBookingId}
            >
              Assign
            </Button>
          </Space>
        </div>
      </Modal>
    </Card>
  );
};

export default TherapistRequestCard;