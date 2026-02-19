'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Card,
  Space,
  Divider,
  Radio,
  message
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { formatCurrency, getCurrencySymbol } from '../../utils/currencyFormatter';
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
  const [paymentMethod, setPaymentMethod] = useState<'online'>('online');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFormChange = (changedValues: any) => {
    setFormData(prev => ({
      ...prev,
      ...changedValues
    }));
  };

  const processRazorpayPayment = async (amount: number, values: any) => {
    try {
      // 1. Create Order
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.service?.price || amount // Send total amount for calculation, not advance
        })
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error(orderData.error);

      // 2. Check for Mock Mode
      if (orderData.isMock) {
        message.info('Test Mode: Simulating Razorpay Payment...');

        // Simulate user interaction delay
        setTimeout(async () => {
          try {
            // 3. Verify Payment (Mock)
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.order.id,
                razorpay_payment_id: `pay_mock_${Date.now()}`,
                razorpay_signature: 'mock_signature',
                bookingId: booking.id,
                amount: amount, // This is the advance amount
                customerData: {
                  fullName: values.fullName,
                  email: values.email,
                  phone: values.phone
                }
              })
            });

            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              message.success('Payment successful (Test Mode)!');
              onConfirm({ ...values, paymentDetails: verifyResult.data });
            } else {
              message.error(verifyResult.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error(error);
            message.error('Payment verification failed');
          } finally {
            setIsProcessing(false);
          }
        }, 1500);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: booking.business?.name || "Wellness Platform",
        description: `Payment for ${booking.service?.name}`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            // 4. Verify Payment
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking.id,
                amount: amount, // This is the advance amount
                customerData: {
                  fullName: values.fullName,
                  email: values.email,
                  phone: values.phone
                }
              })
            });

            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              message.success('Payment successful!');
              onConfirm({ ...values, paymentDetails: verifyResult.data });
            } else {
              message.error(verifyResult.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error(error);
            message.error('Payment verification failed');
          }
        },
        prefill: {
          name: values.fullName,
          email: values.email,
          contact: values.phone
        },
        theme: {
          color: "#1890ff"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Razorpay Error:', error);
      message.error(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };



  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      setIsProcessing(true);

      const totalAmount = booking.service?.price || 0;
      const advanceAmount = totalAmount * 0.5; // 50% advance
      await processRazorpayPayment(advanceAmount, values);

    } catch (error: any) {
      console.error('Validation Error:', error);
      setIsProcessing(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setPaymentMethod('online');
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
        <Button key="cancel" onClick={onCancel} disabled={isProcessing}>
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
      styles={{
        body: {
          height: '550px', // Increased height for payment options
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        scrollBehavior: 'smooth'
      }}>
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

            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
                    Payment Summary
                  </Text>
                  <div style={{ paddingLeft: 20 }}>
                    <div style={{ marginBottom: 4 }}>
                      <Text>Total: </Text>
                      <Text strong>{formatCurrency(booking.service.price, booking.business?.address?.country || 'default')}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text>Advance (50%): </Text>
                      <Text strong type="success">{formatCurrency(booking.service.price * 0.5, booking.business?.address?.country || 'default')}</Text>
                    </div>
                    <div>
                      <Text>Remaining at Venue: </Text>
                      <Text strong>{formatCurrency(booking.service.price * 0.5, booking.business?.address?.country || 'default')}</Text>
                    </div>
                  </div>
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
          marginBottom: 24,
          paddingRight: '12px',
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
                { required: true, message: 'Please enter your full name' },
                { min: 2, message: 'Name must be at least 2 characters' }
              ]}
            >
              <Input placeholder="Enter your full name" size="large" />
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
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input placeholder="Enter your email address" size="large" />
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
                { required: true, message: 'Please enter your phone number' },
                { pattern: /^[\+]?[1-9][\d]{0,15}$/, message: 'Please enter a valid phone number' }
              ]}
            >
              <Input placeholder="Enter your phone number" size="large" />
            </Form.Item>
          </Form>
        </div>

        <Divider style={{ margin: '16px 0', flexShrink: 0 }} />

        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Payment Method
          </Title>
          <div style={{
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#e6f7ff',
            borderColor: '#1890ff'
          }}>
            <Space>
              <CreditCardOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
              <div>
                <Text strong>Pay Online</Text>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  Secure payment via Razorpay
                </div>
              </div>
            </Space>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default BookingConfirmationModal;