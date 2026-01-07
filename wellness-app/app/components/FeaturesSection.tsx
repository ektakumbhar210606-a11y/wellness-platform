'use client';

import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import {
  CalendarOutlined,
  SafetyOutlined,
  StarOutlined,
  DollarOutlined,
  MobileOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeaturesSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: <CalendarOutlined style={{ fontSize: '40px' }} />,
      title: 'Easy Booking',
      description: 'Book appointments 24/7 with real-time availability. Get instant confirmations and reminders.',
      color: '#667eea',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '40px' }} />,
      title: 'Verified Professionals',
      description: 'All providers are thoroughly vetted and certified. Your safety and satisfaction are our priority.',
      color: '#764ba2',
    },
    {
      icon: <StarOutlined style={{ fontSize: '40px' }} />,
      title: 'Quality Guaranteed',
      description: 'Read reviews, compare ratings, and choose from the best-rated wellness professionals.',
      color: '#f093fb',
    },
    {
      icon: <DollarOutlined style={{ fontSize: '40px' }} />,
      title: 'Transparent Pricing',
      description: 'See upfront pricing with no hidden fees. Compare services and find the perfect match for your budget.',
      color: '#4facfe',
    },
    {
      icon: <MobileOutlined style={{ fontSize: '40px' }} />,
      title: 'Mobile-First',
      description: 'Manage bookings, payments, and communications seamlessly on any device, anywhere.',
      color: '#43e97b',
    },
    {
      icon: <TeamOutlined style={{ fontSize: '40px' }} />,
      title: 'Community Driven',
      description: 'Join a thriving community of wellness enthusiasts and professionals dedicated to holistic health.',
      color: '#fa709a',
    },
  ];

  return (
    <div
      style={{
        padding: '80px 0',
        background: '#ffffff',
      }}
    >
      <div style={{ width: '100%', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <Title level={2} style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '16px' }}>
            Why Choose WellnessHub?
          </Title>
          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            We bring together the best of wellness services and technology to create an unparalleled experience
            for both clients and professionals.
          </Paragraph>
        </div>

        {/* Features Grid */}
        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                variant="borderless"
                hoverable
                style={{
                  height: '100%',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '32px' } }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <Title level={4} style={{ marginBottom: '12px', fontSize: '20px' }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: '#666', marginBottom: 0, fontSize: '15px', lineHeight: 1.6 }}>
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default FeaturesSection;
