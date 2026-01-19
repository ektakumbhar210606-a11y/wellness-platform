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
import { LockOutlined } from '@ant-design/icons';
import { postApi } from '@/lib/api';

const { Title, Text } = Typography;

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onResetSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ 
  open, 
  onClose, 
  token,
  onResetSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const getFieldValue = form.getFieldValue;

  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    setLoading(true);
    
    try {
      // Omit confirmPassword field from the payload
      const { confirmPassword, ...payload } = values;
      
      await postApi('/api/auth/reset-password', {
        body: {
          token,
          newPassword: payload.newPassword
        }
      });

      message.success('Password reset successfully! You can now log in with your new password.');
      
      // Close modal and trigger success callback
      onClose();
      onResetSuccess();
    } catch (error: any) {
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
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={true}
      width={480}
      destroyOnClose
      maskClosable={false}
      style={{
        top: 20,
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
        name="reset_password_form"
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
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character!',
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#667eea' }} />}
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
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#667eea' }} />}
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
    </Modal>
  );
};

export default ResetPasswordModal;