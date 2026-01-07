'use client';

import React from 'react';
import { Row, Col, Card, Typography, Steps, Tabs } from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  CalendarOutlined,
  SmileOutlined,
  ShopOutlined,
  ProfileOutlined,
  RocketOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const HowItWorksSection: React.FC = () => {
  const customerSteps: Step[] = [
    {
      title: 'Create Account',
      description: 'Sign up in seconds with your email or social media account.',
      icon: <UserAddOutlined style={{ fontSize: '32px', color: '#667eea' }} />,
    },
    {
      title: 'Browse Services',
      description: 'Explore wellness services, read reviews, and compare professionals.',
      icon: <SearchOutlined style={{ fontSize: '32px', color: '#667eea' }} />,
    },
    {
      title: 'Book Appointment',
      description: 'Select your preferred time slot and confirm your booking instantly.',
      icon: <CalendarOutlined style={{ fontSize: '32px', color: '#667eea' }} />,
    },
    {
      title: 'Enjoy & Relax',
      description: 'Experience premium wellness services and leave reviews for others.',
      icon: <SmileOutlined style={{ fontSize: '32px', color: '#667eea' }} />,
    },
  ];

  const providerSteps: Step[] = [
    {
      title: 'Register Business',
      description: 'Create your provider profile with business details and certifications.',
      icon: <ShopOutlined style={{ fontSize: '32px', color: '#764ba2' }} />,
    },
    {
      title: 'Complete Profile',
      description: 'Add services, pricing, availability, and showcase your expertise.',
      icon: <ProfileOutlined style={{ fontSize: '32px', color: '#764ba2' }} />,
    },
    {
      title: 'Get Discovered',
      description: 'Appear in search results and receive booking requests from clients.',
      icon: <RocketOutlined style={{ fontSize: '32px', color: '#764ba2' }} />,
    },
    {
      title: 'Grow Revenue',
      description: 'Manage bookings, accept payments, and grow your wellness business.',
      icon: <DollarCircleOutlined style={{ fontSize: '32px', color: '#764ba2' }} />,
    },
  ];

  const renderSteps = (steps: Step[], color: string) => (
    <Row gutter={[32, 32]} style={{ marginTop: '40px' }}>
      {steps.map((step, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            variant="borderless"
            style={{
              height: '100%',
              textAlign: 'center',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'visible',
            }}
            styles={{ body: { padding: '32px 24px' } }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {index + 1}
            </div>
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>{step.icon}</div>
            <Title level={5} style={{ marginBottom: '12px', fontSize: '18px' }}>
              {step.title}
            </Title>
            <Paragraph style={{ color: '#666', marginBottom: 0, fontSize: '14px' }}>
              {step.description}
            </Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div
      style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      }}
    >
      <div style={{ width: '100%', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '16px' }}>
            How It Works
          </Title>
          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Get started in minutes, whether you're looking for wellness services or ready to grow your business.
          </Paragraph>
        </div>

        {/* Tabs for different user types */}
        <Tabs
          defaultActiveKey="customer"
          centered
          size="large"
          style={{
            marginBottom: '32px',
          }}
          items={[
            {
              key: 'customer',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  <UserAddOutlined /> For Customers
                </span>
              ),
              children: renderSteps(customerSteps, '#667eea'),
            },
            {
              key: 'provider',
              label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  <ShopOutlined /> For Providers
                </span>
              ),
              children: renderSteps(providerSteps, '#764ba2'),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default HowItWorksSection;
