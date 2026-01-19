'use client';

import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Typography, 
  message 
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { postApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  open, 
  onClose, 
  onBackToLogin 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    
    try {
      await postApi('/api/auth/forgot-password', {
        body: {
          email: values.email
        }
      });

      message.success('Password reset email sent if user exists');
      
      // Close modal and go back to login after a short delay
      setTimeout(() => {
        onClose();
        onBackToLogin();
      }, 1500);
    } catch (error: any) {
      message.error('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={true}
      width={420}
      destroyOnHidden={true}
      maskClosable={false}
      style={{
        top: 20,
      }}
      styles={{
        body: {
          padding: '40px 32px',
        }
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div 
          style={{
            fontSize: '40px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}
        >
          🧘‍♀️ Serenity
        </div>
        <Title level={2} style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>
          Forgot Password
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Enter your email address and we'll send you a link to reset your password
        </Text>
      </div>

      <Form
        form={form}
        name="forgot_password_form"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        style={{
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email address!' }
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#667eea' }} />}
            placeholder="Enter your email address" 
            style={{ 
              borderRadius: '8px',
              height: '48px',
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '0', marginTop: '24px' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              width: '100%',
              height: '50px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderColor: 'transparent',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '8px',
            }}
          >
            Send Reset Link
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Remember your password?{' '}
          <a 
            onClick={onBackToLogin}
            style={{ color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
          >
            Sign in
          </a>
        </Text>
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;