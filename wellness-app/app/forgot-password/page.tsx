'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Form, 
  Input, 
  Typography, 
  message, 
  Card,
  Row,
  Col
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { postApi } from '@/lib/api';

const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    
    try {
      await postApi('/api/auth/forgot-password', {
        body: {
          email: values.email
        }
      });

      message.success('Password reset email sent if user exists');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      message.error('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Row justify="center" align="middle" style={{ width: '100%', maxWidth: '500px' }}>
        <Col span={24}>
          <Card 
            style={{
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
            styles={{
              body: {
                padding: '40px',
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
                  style={{ borderRadius: '8px', height: '48px' }}
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
                  onClick={() => router.push('/')} 
                  style={{ color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
                >
                  Sign in
                </a>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPasswordPage;