'use client';

import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Card, 
  Space,
  Divider
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  DollarCircleOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/currencyFormatter';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';

const { Title, Text } = Typography;

interface BookingConfirmationModalProps {
  visible: boolean;
  booking: any;
  onCancel: () => void;
  onConfirm: (formData: any) => void;
  loading?: boolean;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  visible,
  booking,
  onCancel,
  onConfirm,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFormChange = (changedValues: any) => {
    setFormData(prev => ({
      ...prev,
      ...changedValues
    }));
  };

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      
      // Show loading state
      setIsProcessing(true);
      
      // Get service price for payment amount
      const amount = booking.service?.price || 0;
      
      // Prepare payment data
      const paymentData = {
        bookingId: booking.id,
        customerData: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone
        },
        amount: amount
      };

      // Call Razorpay payment API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/razorpay/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Call the original onConfirm with payment details
      onConfirm({
        ...values,
        paymentDetails: result.data
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      // Show error message to user
      // In a real implementation, you'd use Ant Design's message component
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
      setFormData({
        fullName: '',
        email: '',
        phone: ''
      });
    }
  }, [visible, form]);

  if (!booking) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Confirm Your Booking</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          onClick={handleConfirm}
          loading={isProcessing}
        >
          Pay Now
        </Button>
      ]}
      width={600}
      style={{
        maxHeight: 'calc(100vh - 100px)',
        margin: 'auto'
      }}
      bodyStyle={{
        height: '450px',
        padding: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        scrollbarWidth: 'none',  /* Firefox */
        msOverflowStyle: 'none',  /* IE 10+ */
        scrollBehavior: 'smooth'  /* Smooth scrolling */
      }}>
        {/* Hide scrollbar for WebKit browsers */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <Card size="small" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae7ff' }}>
            <Title level={5} style={{ marginBottom: 16, color: '#1890ff' }}>
              Booking Details
            </Title>
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Service
                </Text>
                <Text>{booking.service?.name || 'N/A'}</Text>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Therapist
                </Text>
                <Text>
                  {booking.therapist?.fullName || 'Not assigned'} 
                  {booking.therapist?.professionalTitle ? ` (${booking.therapist.professionalTitle})` : ''}
                </Text>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Date & Time
                </Text>
                <Text>
                  {booking.date} at {formatTimeTo12Hour(booking.time || '')}
                </Text>
              </div>
              
              {booking.service?.duration && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Duration
                  </Text>
                  <Text>{booking.service.duration} minutes</Text>
                </div>
              )}
              
              {booking.service?.price !== undefined && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    <DollarCircleOutlined style={{ marginRight: 8 }} />
                    Price
                  </Text>
                  <Text type="success" strong>
                    {formatCurrency(booking.service.price, booking.business?.address?.country || 'USA')}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </div>

        <Divider style={{ margin: '16px 0', flexShrink: 0 }} />
        
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Customer Information
          </Title>
        </div>
        
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          marginBottom: 24,
          paddingRight: '12px',
          minHeight: '200px',  /* Ensure there's enough space for the form fields */
          scrollBehavior: 'smooth'  /* Smooth scrolling for form area */
        }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
            autoComplete="off"
          >
            <Form.Item
              name="fullName"
              label={
                <span>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Full Name
                </span>
              }
              rules={[
                { 
                  required: true, 
                  message: 'Please enter your full name' 
                },
                { 
                  min: 2, 
                  message: 'Name must be at least 2 characters' 
                }
              ]}
            >
              <Input 
                placeholder="Enter your full name" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={
                <span>
                  <MailOutlined style={{ marginRight: 8 }} />
                  Email Address
                </span>
              }
              rules={[
                { 
                  required: true, 
                  message: 'Please enter your email address' 
                },
                { 
                  type: 'email', 
                  message: 'Please enter a valid email address' 
                }
              ]}
            >
              <Input 
                placeholder="Enter your email address" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={
                <span>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  Phone Number
                </span>
              }
              rules={[
                { 
                  required: true, 
                  message: 'Please enter your phone number' 
                },
                { 
                  pattern: /^[\+]?[1-9][\d]{0,15}$/, 
                  message: 'Please enter a valid phone number' 
                }
              ]}
            >
              <Input 
                placeholder="Enter your phone number" 
                size="large"
              />
            </Form.Item>
          </Form>
        </div>

      </div>
    </Modal>
  );
};

export default BookingConfirmationModal;