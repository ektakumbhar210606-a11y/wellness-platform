'use client';

import React, { useState, use } from 'react';
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
import { useRouter } from 'next/navigation';
import { postApi } from '@/lib/api';

const { Title, Text } = Typography;

interface PasswordResetPageProps {
  params: Promise<{ token: string }>; // Changed to Promise
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ params }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const resolvedParams = use(params); // Use React.use() to unwrap the params
  const token = resolvedParams.token;

  const getFieldValue = form.getFieldValue;

  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    setLoading(true);
    
    try {
      // Omit confirmPassword field from the payload
      const { confirmPassword, ...payload } = values;
      
      // Send the token from URL params and new password to the backend
      const response = await postApi(`/api/auth/reset-password/${token}`, {
        body: {
          password: payload.newPassword
        }
      });

      if (response.success) {
        message.success('Password reset successfully! You can now log in with your new password.');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        message.error(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.status === 400) {
        message.error('Invalid input: ' + (error.message || 'Please check your password details'));
      } else if (error.status === 401) {
        message.error('Invalid or expired reset token. Please request a new password reset.');
      } else if (error.status === 404) {
        message.error('Invalid reset token. Please request a new password reset.');
      } else if (error.status === 500) {
        message.error('Server error: ' + (error.message || 'Internal server error'));
      } else {
        message.error('Password reset failed: ' + (error.message || 'Please try again'));
      }
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
                Reset Your Password
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Enter your new password to continue
              </Text>
            </div>

            <Form
              form={form}
              name="password_reset_form"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'Please input your new password!' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                  }
                ]}
              >
                <Input.Password
                  placeholder="Enter your new password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  {
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                  }
                ]}
              >
                <Input.Password
                  placeholder="Confirm your new password"
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
                  Reset Password
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

export default PasswordResetPage;