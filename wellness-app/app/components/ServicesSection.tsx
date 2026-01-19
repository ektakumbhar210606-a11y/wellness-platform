'use client';

import React from 'react';
import { Row, Col, Card, Typography, Divider } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  icon, 
  title, 
  description, 
  features, 
  color 
}) => (
  <Card
    style={{
      borderRadius: '16px',
      border: '1px solid #e8e8e8',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    }}
    styles={{
      body: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }
    }}
  >
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: `${color}20`,
        marginBottom: '20px',
      }}
    >
      <span style={{ color, fontSize: '28px' }}>
        {icon}
      </span>
    </div>
    
    <Title 
      level={3} 
      style={{ 
        margin: '0 0 16px 0', 
        fontSize: '20px', 
        fontWeight: 600,
        color: '#262626',
        textAlign: 'center',
      }}
    >
      {title}
    </Title>
    
    <Paragraph 
      style={{ 
        margin: '0 0 20px 0', 
        fontSize: '15px',
        color: '#666',
        textAlign: 'center',
        lineHeight: 1.6,
        flex: 1,
      }}
    >
      {description}
    </Paragraph>
    
    <div>
      <Divider style={{ margin: '16px 0', borderColor: '#e8e8e8' }} />
      <Title 
        level={5} 
        style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          fontWeight: 600,
          color: '#262626',
          textAlign: 'left',
        }}
      >
        Included Services:
      </Title>
      <ul 
        style={{ 
          margin: 0, 
          padding: '0 0 0 20px', 
          textAlign: 'left',
          color: '#666',
          fontSize: '14px',
        }}
      >
        {features.map((feature, index) => (
          <li key={index} style={{ marginBottom: index === features.length - 1 ? 0 : '8px' }}>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

const ServicesSection: React.FC = () => {
  const services = [
    {
      key: 'customer',
      icon: <UserOutlined />,
      title: 'Customer Services',
      description: 'Access premium wellness services tailored to your needs. Book appointments, discover top-rated professionals, and enjoy personalized experiences.',
      features: [
        'Easy appointment booking',
        'Service reviews and ratings',
        'Personalized recommendations',
        'Loyalty rewards program',
        'Secure payment processing'
      ],
      color: '#667eea',
    },
    {
      key: 'provider',
      icon: <ShopOutlined />,
      title: 'Provider Services',
      description: 'Grow your wellness business with our platform. Manage bookings, reach new customers, and streamline operations.',
      features: [
        'Business profile management',
        'Appointment scheduling system',
        'Customer management tools',
        'Marketing and promotion tools',
        'Financial reporting dashboard'
      ],
      color: '#f093fb',
    },
    {
      key: 'therapist',
      icon: <TeamOutlined />,
      title: 'Professional Services',
      description: 'Connect with clients and showcase your expertise. Access tools to manage your practice and grow your professional network.',
      features: [
        'Professional profile creation',
        'Client appointment management',
        'Payment processing tools',
        'Performance analytics',
        'Skill certification programs'
      ],
      color: '#764ba2',
    },
  ];

  return (
    <div
      id="services-section"
      style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
      }}
    >
      <div style={{ 
        width: '100%', 
        paddingLeft: '24px', 
        paddingRight: '24px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title 
            level={2} 
            style={{ 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              marginBottom: '16px',
              color: '#262626',
            }}
          >
            Our Services
          </Title>
          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2vw, 18px)',
              color: '#666',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Discover services tailored to your role in our wellness ecosystem. Whether you're seeking services, providing them, or growing your business, we have the right tools for you.
          </Paragraph>
        </div>

        {/* Service Cards Grid */}
        <Row 
          gutter={[32, 32]} 
          justify="center"
        >
          {services.map((service, index) => (
            <Col 
              key={service.key} 
              xs={24} 
              sm={24} 
              md={12} 
              lg={8} 
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ServiceCard
                icon={service.icon}
                title={service.title}
                description={service.description}
                features={service.features}
                color={service.color}
              />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default ServicesSection;