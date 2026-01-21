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
import { postApi } from '@/lib/api';
import { customerApi } from '@/app/utils/apiUtils';
import { useRouter } from 'next/navigation';
import ForgotPasswordModal from './auth/ForgotPasswordModal';

const { Title, Text, Paragraph } = Typography;

interface AuthModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  initialView?: 'login' | 'register' | 'roleSelection';
  resetToken?: string | null;
}

// Define user role types
type UserRole = 'customer' | 'provider' | 'therapist';

const AuthModal: React.FC<AuthModalProps> = ({ 
  open, 
  onCancel, 
  onSuccess,
  initialView = 'login'
}) => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'roleSelection' | 'reset'>(initialView);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  
  // Reset internal state when modal closes to ensure fresh state on reopen
  React.useEffect(() => {
    if (!open) {
      // Reset to initial view and clear selected role when modal closes
      setCurrentView(initialView);
      setSelectedRole(null);
      // Reset forms
      loginForm.resetFields();
      registerForm.resetFields();
    }
  }, [open, initialView, loginForm, registerForm]);
  
  // Update currentView when initialView changes (when modal is open)
  React.useEffect(() => {
    if (open) {
      setCurrentView(initialView);
    }
  }, [initialView, open]);
  
  const getFieldValue = registerForm.getFieldValue;

  const handleLogin = async (values: any) => {
    setLoginLoading(true);
    try {
      // Prepare login payload - the API expects an email field
      // Since the form field is labeled 'Email or Username', we'll send whatever the user entered
      const payload = {
        email: values.username, // Backend will handle both email and username formats
        password: values.password
      };
      
      // Call the backend API
      const response = await postApi('/api/auth/login', {
        body: payload
      });
      
      // Extract token and user data from response
      const { token, user } = response;
      
      // Store the JWT token in localStorage with the key 'token'
      localStorage.setItem('token', token);
      
      // Update auth state with user data from the API
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      };
      login(userData);
      
      // Show success message
      message.success('Login successful!');
      
      // Handle role-specific redirects after login
      if (userData.role?.toLowerCase() === 'therapist') {
        try {
          // Check if therapist profile exists
          const profileResponse = await fetch('/api/therapist/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`, // Use the token from response directly
              'Content-Type': 'application/json',
            },
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.data) {
              // Therapist profile exists, redirect to dashboard
              setTimeout(() => {
                router.push('/dashboard/therapist');
              }, 500); // Small delay to allow modal to close and message to show
            } else {
              // Therapist profile doesn't exist, redirect to onboarding
              setTimeout(() => {
                router.push('/onboarding/therapist');
              }, 500); // Small delay to allow modal to close and message to show
            }
          } else {
            // Therapist profile doesn't exist, redirect to onboarding
            setTimeout(() => {
              router.push('/onboarding/therapist');
            }, 500); // Small delay to allow modal to close and message to show
          }
        } catch (error) {
          console.error('Error checking therapist profile:', error);
          // Fallback to onboarding if there's an error
          setTimeout(() => {
            router.push('/onboarding/therapist');
          }, 500); // Small delay to allow modal to close and message to show
        }
        
        // Don't call onSuccess or close modal for therapists, as redirect will happen
      } else if (userData.role && (userData.role.toLowerCase() === 'provider' || userData.role.toLowerCase() === 'business')) {
        // Check if provider already has a business profile
        try {
          // Fetch business profile to see if onboarding is already completed
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/my-business`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            // Provider already has a business profile, redirect to dashboard
            setTimeout(() => {
              router.push('/dashboard/provider');
            }, 500); // Small delay to allow modal to close and message to show
          } else {
            // Provider doesn't have a business profile, redirect to onboarding
            setTimeout(() => {
              router.push('/onboarding/provider');
            }, 500); // Small delay to allow modal to close and message to show
          }
        } catch (error) {
          // If there's an error checking business profile, redirect to onboarding
          setTimeout(() => {
            router.push('/onboarding/provider');
          }, 500); // Small delay to allow modal to close and message to show
        }
      } else {
        // For customers, check if onboarding is already completed
        try {
          const hasOnboarded = await customerApi.hasCompletedOnboarding();
          
          if (hasOnboarded) {
            // Customer has completed onboarding, redirect to dashboard
            setTimeout(() => {
              router.push('/dashboard/customer');
            }, 500); // Small delay to allow modal to close and message to show
          } else {
            // Customer hasn't completed onboarding, redirect to onboarding
            setTimeout(() => {
              router.push('/onboarding/customer');
            }, 500); // Small delay to allow modal to close and message to show
          }
        } catch (error) {
          console.error('Error checking customer onboarding status:', error);
          // If there's an error checking onboarding status, redirect to onboarding
          setTimeout(() => {
            router.push('/onboarding/customer');
          }, 500); // Small delay to allow modal to close and message to show
        }
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.status === 400) {
        message.error('Invalid input: ' + (error.message || 'Email and password are required'));
      } else if (error.status === 401) {
        message.error('Authentication failed: ' + (error.message || 'Invalid email or password'));
      } else if (error.status === 500) {
        message.error('Server error: ' + (error.message || 'Internal server error'));
      } else {
        message.error('Login failed: ' + (error.message || 'Please check your credentials'));
      }
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
      // Prepare registration payload based on selected role
      // Omit confirmPassword field from the payload
      const { confirmPassword, ...filteredValues } = values;
      
      let payload: any = {
        email: filteredValues.email,
        password: filteredValues.password,
        role: selectedRole === 'customer' ? 'Customer' : 
              selectedRole === 'provider' ? 'Business' : 'Therapist'
      };
      
      // Add role-specific fields
      if (selectedRole === 'customer') {
        payload.full_name = filteredValues.name;
      } else if (selectedRole === 'provider') {
        payload.business_name = filteredValues.businessName;
        payload.owner_full_name = filteredValues.name;
      } else if (selectedRole === 'therapist') {
        payload.full_name = filteredValues.name;
        payload.professional_title = filteredValues.professionalTitle;
      }
      
      // Call the backend API
      const response = await postApi('/api/auth/register', {
        body: payload
      });
      
      // Extract user data and token from response
      const { user, token } = response;
      
      // Update auth state with user data from the API
      login({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      });
      
      // Store the token in localStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Show success message
      message.success('Registration successful! Welcome to our wellness platform.');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Handle role-specific redirects after registration
      if (user.role && user.role.toLowerCase() === 'therapist') {
        // Therapists should go to onboarding after registration
        setTimeout(() => {
          router.push('/onboarding/therapist');
        }, 500); // Small delay to allow modal to close and message to show
      } else if (user.role && (user.role.toLowerCase() === 'provider' || user.role.toLowerCase() === 'business')) {
        // Check if provider already has a business profile
        try {
          // Fetch business profile to see if onboarding is already completed
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/my-business`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            // Provider already has a business profile, redirect to dashboard
            setTimeout(() => {
              router.push('/dashboard/provider');
            }, 500); // Small delay to allow modal to close and message to show
          } else {
            // Provider doesn't have a business profile, redirect to onboarding
            setTimeout(() => {
              router.push('/onboarding/provider');
            }, 500); // Small delay to allow modal to close and message to show
          }
        } catch (error) {
          // If there's an error checking business profile, redirect to onboarding
          setTimeout(() => {
            router.push('/onboarding/provider');
          }, 500); // Small delay to allow modal to close and message to show
        }
      } else {
        // For customers, after registration they need to complete onboarding
        setTimeout(() => {
          router.push('/onboarding/customer');
        }, 500); // Small delay to allow modal to close and message to show
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.status === 400) {
        message.error('Invalid input: ' + (error.message || 'Please check your registration details'));
      } else if (error.status === 409) {
        message.error('Registration failed: ' + (error.message || 'A user with this email already exists'));
      } else if (error.status === 500) {
        message.error('Server error: ' + (error.message || 'Internal server error'));
      } else {
        message.error('Registration failed: ' + (error.message || 'Please try again'));
      }
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
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
        form={loginForm}
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={handleLogin}
        layout="vertical"
        size="large"
        // style={{
        //   maxWidth: '360px',
        //   margin: '0 auto',
        // }}
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

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div 
            style={ {
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
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: 600,
            }}
          >
            Choose Your Role
          </Title>
          <Text 
            style={{ 
              fontSize: '14px',
              color: '#666',
            }}
          >
            Select the account type that best fits your wellness journey
          </Text>
        </div>

        <Row 
          gutter={[16, 16]} 
          justify="center"
          style={{ marginBottom: '16px', maxWidth: '500px', margin: '0 auto 16px' }}
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
                  height: '180px',
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
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
            maxWidth: '360px',
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
                rules={[{ required: true, message: 'Please input your password!' }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[{ required: true, message: 'Please confirm your password!' }, {
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Confirm your password"
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
                rules={[{ required: true, message: 'Please input your password!' }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[{ required: true, message: 'Please confirm your password!' }, {
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Confirm your password"
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
                rules={[{ required: true, message: 'Please input your password!' }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Enter your password"
                  style={{ borderRadius: '8px', height: '48px' }}
                />
              </Form.Item>
              
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[{ required: true, message: 'Please confirm your password!' }, {
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }, {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 
                  message: 'Password must be at least 8 characters with uppercase, lowercase, and number!',
                }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#667eea' }} />}
                  placeholder="Confirm your password"
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

  const handleModalCancel = () => {
    // Reset internal state to ensure clean state on next open
    setCurrentView(initialView);
    setSelectedRole(null);
    // Reset forms to clear any entered data
    loginForm.resetFields();
    registerForm.resetFields();
    // Call the parent's cancel handler
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={handleModalCancel}
      footer={null}
      closable={true}
      width={480}
      centered
      destroyOnHidden
      maskClosable={false}
      styles={{
        body: {
          // padding: '16px 20px',
        },
        container: {
          maxHeight: '80vh',
      overflow: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
        }
      }}
    >
      {currentView === 'login' && renderLoginView()}
      {currentView === 'roleSelection' && renderRoleSelectionView()}
      {currentView === 'register' && renderRegisterView()}
      {currentView === 'reset' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Opening password reset...
          </Text>
        </div>
      )}
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

export default AuthModal;