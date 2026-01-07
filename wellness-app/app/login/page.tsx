'use client';

import React, { useState } from 'react';
import { LockOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message, Divider, Space, Row, Col, Checkbox } from 'antd';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Login successful!');
      console.log('Login values:', values);
      // In a real app, you would redirect to dashboard or home
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        <Card
          variant="outlined"
          style={{
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: '40px 32px' } }}
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
              maxWidth: '400px',
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '8px' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: '14px', color: '#666' }}>
                  Remember me
                </Checkbox>
              </Form.Item>

              <Link href="/forgot-password" style={{ fontSize: '14px', color: '#667eea' }}>
                Forgot password?
              </Link>
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

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#667eea', fontWeight: 500 }}>
                Sign up
              </Link>
            </Text>
          </div>


        </Card>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
            © {new Date().getFullYear()} Serenity. All rights reserved.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;