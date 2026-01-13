'use client';

import React from 'react';
import { Row, Col, Button, Typography, Space } from 'antd';
import { UserAddOutlined, ShopOutlined, TeamOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HeroSection: React.FC = () => {
  return (
    <div
      id="hero-section"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '120px 24px 80px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[48, 48]} align="middle">
          {/* Left Content */}
          <Col xs={24} lg={12}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title
                  level={1}
                  style={{
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    marginBottom: '24px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  Transform Your Wellness Journey
                </Title>
                <Paragraph
                  style={{
                    fontSize: 'clamp(16px, 2vw, 20px)',
                    color: '#666',
                    marginBottom: '32px',
                    lineHeight: 1.6,
                  }}
                >
                  Connect with top-rated spa professionals, discover wellness services, and manage your
                  business - all in one platform. Whether you're seeking relaxation or growing your
                  practice, we've got you covered.
                </Paragraph>
              </div>

              {/* CTA Buttons */}
              <Space size="middle" wrap style={{ marginBottom: '32px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<UserAddOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderColor: 'transparent',
                    height: '48px',
                    padding: '0 32px',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    // This will trigger the auth modal from the Navbar context
                    const event = new CustomEvent('openAuthModal', { detail: { view: 'roleSelection' } });
                    window.dispatchEvent(event);
                  }}
                >
                  Find Services
                </Button>
                <Button
                  size="large"
                  icon={<ShopOutlined />}
                  style={{
                    height: '48px',
                    padding: '0 32px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderWidth: '2px',
                  }}
                  onClick={() => {
                    // This will trigger the auth modal from the Navbar context
                    const event = new CustomEvent('openAuthModal', { detail: { view: 'roleSelection' } });
                    window.dispatchEvent(event);
                  }}
                >
                  Join as Provider
                </Button>
              </Space>

              {/* Stats */}
              <Row gutter={[24, 16]}>
                <Col xs={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                      10K+
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>Professionals</Paragraph>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                      50K+
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>Happy Clients</Paragraph>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                      500+
                    </Title>
                    <Paragraph style={{ margin: 0, color: '#666' }}>Locations</Paragraph>
                  </div>
                </Col>
              </Row>
            </Space>
          </Col>

          {/* Right Content - Visual */}
          <Col xs={24} lg={12}>
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '48px',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* Decorative Content */}
              <div style={{ color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>🧘‍♀️</div>
                <Title level={3} style={{ color: 'white', marginBottom: '16px' }}>
                  Your Wellness, Your Way
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                  Experience the perfect blend of traditional spa services and modern wellness solutions
                </Paragraph>
              </div>

              {/* Floating Cards */}
              <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
                <Col span={12}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💆‍♀️</div>
                    <Paragraph style={{ color: 'white', margin: 0, fontWeight: 500 }}>
                      Massage Therapy
                    </Paragraph>
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌿</div>
                    <Paragraph style={{ color: 'white', margin: 0, fontWeight: 500 }}>
                      Aromatherapy
                    </Paragraph>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HeroSection;
