'use client';

import React from 'react';
import { 
  UserOutlined, 
  TeamOutlined, 
  ShopOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Typography, 
  Row, 
  Col,
  Space
} from 'antd';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

// Define user role types
type UserRole = 'customer' | 'provider' | 'therapist';

const RoleSelectionPage = () => {
  // Role options with icons and descriptions
  const roleOptions = [
    {
      key: 'customer',
      title: 'Customer',
      icon: <UserOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
      description: 'Book wellness services and experiences tailored to your needs. Discover top-rated therapists and services.',
      link: '/register?role=customer',
    },
    {
      key: 'provider',
      title: 'Provider (Business)',
      icon: <ShopOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
      description: 'List and manage your wellness business. Reach customers looking for your services and grow your business.',
      link: '/register?role=provider',
    },
    {
      key: 'therapist',
      title: 'Therapist',
      icon: <TeamOutlined style={{ fontSize: '40px', color: '#667eea' }} />,
      description: 'Provide wellness services to clients. Showcase your skills and connect with people seeking your expertise.',
      link: '/register?role=therapist',
    },
  ];

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
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div 
            style={{
              fontSize: '40px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f2f5 100%)',
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
              fontSize: '32px', 
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Choose Your Role
          </Title>
          <Text 
            style={{ 
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '600px',
              margin: '0 auto',
              display: 'block',
            }}
          >
            Select the account type that best fits your wellness journey
          </Text>
        </div>

        <Row 
          gutter={[32, 32]} 
          justify="center"
          style={{ marginBottom: '32px' }}
        >
          {roleOptions.map((role, index) => (
            <Col 
              key={role.key} 
              xs={24} 
              sm={24} 
              md={12} 
              lg={8} 
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link href={role.link} style={{ width: '100%' }}>
                <Card
                  hoverable
                  style={{
                    width: '100%',
                    maxWidth: '380px',
                    height: '320px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  styles={{
                    body: {
                      padding: '32px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                    }
                  }}
                >
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(102, 126, 234, 0.1)',
                      marginBottom: '24px',
                    }}
                  >
                    {role.icon}
                  </div>
                  <Title 
                    level={3} 
                    style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '22px', 
                      fontWeight: 600,
                      color: '#262626',
                      textAlign: 'center',
                    }}
                  >
                    {role.title}
                  </Title>
                  <Paragraph 
                    style={{ 
                      margin: '0 0 24px 0', 
                      fontSize: '15px',
                      color: '#666',
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    {role.description}
                  </Paragraph>
                  <Button
                    type="primary"
                    shape="round"
                    size="large"
                    icon={<ArrowRightOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderColor: 'transparent',
                      fontSize: '14px',
                      fontWeight: 500,
                      height: '42px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    Select {role.title}
                  </Button>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#ffffff', fontWeight: 500, textDecoration: 'underline' }}>
              Sign in
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            © {new Date().getFullYear()} Serenity. All rights reserved.
          </Paragraph>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;