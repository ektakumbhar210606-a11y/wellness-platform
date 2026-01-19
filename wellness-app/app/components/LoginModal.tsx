'use client';

import React, { useState } from 'react';
import { LockOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, message, Divider, Space, Modal, Checkbox } from 'antd';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import ForgotPasswordModal from './auth/ForgotPasswordModal';

const { Title, Text } = Typography;

interface LoginModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Call actual login API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.username,
          password: values.password
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Store the JWT token
      localStorage.setItem('token', result.token);
      
      message.success('Login successful!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Update auth state with actual user data
      login({
        id: result.user.id,
        userId: result.user.id, // Add userId for API calls
        name: result.user.name,
        username: result.user.name,
        email: result.user.email,
        role: result.user.role
      });
      
      // Close the modal after successful login
      onCancel();
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={true}
      width={400}
      destroyOnHidden={true}
      maskClosable={false}
      style={{
        top: 20,
      }}
      styles={{
        body: {
          padding: '16px 20px',
        }
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
        <Title level={2} style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
          Welcome Back
        </Title>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Sign in to your account to continue your wellness journey
        </Text>
      </div>

      <Form
        form={form}
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
        style={{
          maxWidth: '360px',
          margin: '0 auto',
        }}
      >
        <Form.Item
          label="Email or Username"
          name="username"
          rules={[
            { 
              required: true, 
              message: 'Please input your email or username!' 
            },
            { 
              type: 'email',
              message: 'Please enter a valid email address!',
              validateTrigger: 'onBlur'
            }
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#667eea' }} />} 
            placeholder="Enter your email or username" 
            style={{ 
              borderRadius: '8px',
              height: '48px',
            }}
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            placeholder="Enter your password"
            style={{
              borderRadius: '8px',
              height: '48px',
            }}
            iconRender={(visible: boolean) =>
              visible ? <EyeInvisibleOutlined /> : <EyeOutlined />
            }
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '4px' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ fontSize: '14px', color: '#666' }}>
              Remember me
            </Checkbox>
          </Form.Item>

          <a 
            onClick={() => {
              setShowForgotPasswordModal(true);
            }}
            style={{ fontSize: '14px', color: '#667eea', cursor: 'pointer' }}
          >
            Forgot password?
          </a>
        </div>

        <Form.Item style={{ marginBottom: '0' }}>
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
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#667eea', fontWeight: 500 }}>
            Sign up
          </Link>
        </Text>
      </div>
      <ForgotPasswordModal
        open={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
        }}
      />
    </Modal>
  );
};

export default LoginModal;