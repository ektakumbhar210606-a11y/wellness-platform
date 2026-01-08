'use client';

import React, { useState } from 'react';
import { 
  UserOutlined, 
  TeamOutlined, 
  ShopOutlined, 
  ArrowRightOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Form, 
  Input, 
  Typography, 
  message, 
  Modal, 
  Checkbox,
  Row,
  Col,
  Space
} from 'antd';
import { useAuth } from '@/app/context/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface AuthModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  initialView?: 'login' | 'register' | 'roleSelection';
}

// Define user role types
type UserRole = 'customer' | 'provider' | 'therapist';

const AuthModal: React.FC<AuthModalProps> = ({ 
  open, 
  onCancel, 
  onSuccess,
  initialView = 'login'
}) => {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'roleSelection'>(initialView);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (values: any) => {
    setLoginLoading(true);
    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Login successful!');
      console.log('Login values:', values);
      
      // Update auth state
      login({
        id: 1,
        username: values.username,
        email: values.username.includes('@') ? values.username : undefined
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal after successful login
      onCancel();
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    if (!selectedRole) {
      message.error('Please select a role first');
      return;
    }

    setRegisterLoading(true);
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Registration successful! Please check your email to verify your account.');
      console.log('Registration values:', { ...values, role: selectedRole });
      
      // Update auth state
      login({
        id: 1,
        username: values.email || values.name,
        email: values.email,
        role: selectedRole
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal after successful registration
      onCancel();
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentView('register');
  };

  const handleGoToRoleSelection = () => {
    setCurrentView('roleSelection');
    setSelectedRole(null);
  };

  const handleGoToLogin = () => {
    setCurrentView('login');
    setSelectedRole(null);
  };

  const handleGoToRegister = () => {
    if (!selectedRole) {
      message.error('Please select a role first');
      setCurrentView('roleSelection');
      return;
    }
    setCurrentView('register');
  };

  const renderLoginView = () => (
    <>
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
        form={loginForm}
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={handleLogin}
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

          <a 
            onClick={() => {
              message.info('Password recovery functionality coming soon!');
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
            loading={loginLoading}
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
          <a 
            onClick={handleGoToRoleSelection} 
            style={{ color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
          >
            Sign up
          </a>
        </Text>
      </div>
    </>
  );

  const renderRoleSelectionView = () => {
    const roleOptions = [
      {
        key: 'customer',
        title: 'Customer',
        icon: <UserOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
        description: 'Book wellness services and experiences tailored to your needs. Discover top-rated therapists and services.',
      },
      {
        key: 'provider',
        title: 'Provider (Business)',
        icon: <ShopOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
        description: 'List and manage your wellness business. Reach customers looking for your services and grow your business.',
      },
      {
        key: 'therapist',
        title: 'Therapist',
        icon: <TeamOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
        description: 'Provide wellness services to clients. Showcase your skills and connect with people seeking your expertise.',
      },
    ];

    return (
      <>
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
          <Title 
            level={2} 
            style={{ 
              margin: '0 0 16px 0', 
              fontSize: '28px', 
              fontWeight: 600,
            }}
          >
            Choose Your Role
          </Title>
          <Text 
            style={{ 
              fontSize: '16px',
              color: '#666',
            }}
          >
            Select the account type that best fits your wellness journey
          </Text>
        </div>

        <Row 
          gutter={[24, 24]} 
          justify="center"
          style={{ marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}
        >
          {roleOptions.map((role) => (
            <Col 
              key={role.key} 
              xs={24}
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                onClick={() => handleRoleSelect(role.key as UserRole)}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  height: '200px',
                  borderRadius: '16px',
                  border: '2px solid transparent',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(102, 126, 234, 0.1)',
                    marginBottom: '16px',
                  }}
                >
                  {role.icon}
                </div>
                <Title 
                  level={4} 
                  style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: 600,
                    color: '#262626',
                    textAlign: 'center',
                  }}
                >
                  {role.title}
                </Title>
                <Paragraph 
                  style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#666',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    padding: '0 16px',
                  }}
                >
                  {role.description}
                </Paragraph>
              </div>
            </Col>
          ))}
        </Row>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Already have an account?{' '}
            <a 
              onClick={handleGoToLogin} 
              style={{ color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
            >
              Sign in
            </a>
          </Text>
        </div>
      </>
    );
  };

  const renderRegisterView = () => {
    if (!selectedRole) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Please select an account type to continue
          </Text>
        </div>
      );
    }

    return (
      <>
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
            {`Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Create your account to join our wellness community
          </Text>
        </div>

        <Form
          form={registerForm}
          name="register_form"
          onFinish={handleRegister}
          layout="vertical"
          size="large"
          style={{
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          {selectedRole === 'customer' && (
            <>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please input your name!' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your full name" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email address!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your email" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
            </>
          )}
          
          {selectedRole === 'provider' && (
            <>
              <Form.Item
                label="Business Name"
                name="businessName"
                rules={[{ required: true, message: 'Please input your business name!' }]}
              >
                <Input 
                  prefix={<ShopOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your business name" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Owner Full Name"
                name="name"
                rules={[{ required: true, message: 'Please input your name!' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your full name" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email address!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your email" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
            </>
          )}
          
          {selectedRole === 'therapist' && (
            <>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please input your name!' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your full name" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Professional Title"
                name="professionalTitle"
                rules={[{ required: true, message: 'Please input your professional title!' }]}
              >
                <Input 
                  prefix={<TeamOutlined style={{ color: '#667eea' }} />} 
                  placeholder="e.g., Licensed Massage Therapist" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email address!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#667eea' }} />} 
                  placeholder="Enter your email" 
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: '0' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={registerLoading}
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
              Complete Registration
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Already have an account?{' '}
            <a 
              onClick={handleGoToLogin} 
              style={{ color: '#667eea', fontWeight: 500, cursor: 'pointer' }}
            >
              Sign in
            </a>
          </Text>
        </div>
      </>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={true}
      width={520}
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
      {currentView === 'login' && renderLoginView()}
      {currentView === 'roleSelection' && renderRoleSelectionView()}
      {currentView === 'register' && renderRegisterView()}
    </Modal>
  );
};

export default AuthModal;