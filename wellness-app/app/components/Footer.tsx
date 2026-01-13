'use client';

import React from 'react';
import { Row, Col, Typography, Space, Divider } from 'antd';
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
    services: [
      { label: 'Massage Therapy', href: '/massage-therapy' },
      { label: 'Spa Services', href: '/spa-services' },
      { label: 'Wellness Programs', href: '/wellness-programs' },
      { label: 'Corporate Wellness', href: '/corporate-wellness' },
    ],
    support: [
      { label: 'Help Center', href: '/help-center' },
      { label: 'Safety', href: '/safety' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  };

  const socialLinks = [
    { icon: <FacebookOutlined />, href: '#', label: 'Facebook' },
    { icon: <TwitterOutlined />, href: '#', label: 'Twitter' },
    { icon: <InstagramOutlined />, href: '#', label: 'Instagram' },
    { icon: <LinkedinOutlined />, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer
      id="footer-section"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 0 24px',
      }}
    >
      <div style={{ width: '100%', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* Company Info */}
          <Col xs={24} sm={24} md={6}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                🧘‍♀️ Serenity
              </div>
              <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 0 }}>
                Connecting wellness seekers with certified professionals for a healthier, more balanced life.
              </Paragraph>
              <Space orientation="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)' }}>
                  <MailOutlined />
                  <span>info@serenity.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)' }}>
                  <PhoneOutlined />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)' }}>
                  <EnvironmentOutlined />
                  <span>San Francisco, CA</span>
                </div>
              </Space>
            </Space>
          </Col>

          {/* Company Links */}
          <Col xs={12} sm={8} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '20px' }}>
              Company
            </Title>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              {footerLinks.company.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  style={{ color: 'rgba(255,255,255,0.85)', display: 'block', textDecoration: 'none' }}
                >
                  {link.label}
                </a>
              ))}
            </Space>
          </Col>

          {/* Services Links */}
          <Col xs={12} sm={8} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '20px' }}>
              Services
            </Title>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              {footerLinks.services.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  style={{ color: 'rgba(255,255,255,0.85)', display: 'block', textDecoration: 'none' }}
                >
                  {link.label}
                </a>
              ))}
            </Space>
          </Col>

          {/* Support Links */}
          <Col xs={12} sm={8} md={6}>
            <Title level={5} style={{ color: 'white', marginBottom: '20px' }}>
              Support
            </Title>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              {footerLinks.support.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  style={{ color: 'rgba(255,255,255,0.85)', display: 'block', textDecoration: 'none' }}
                >
                  {link.label}
                </a>
              ))}
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '40px 0 24px' }} />

        {/* Bottom Section */}
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} sm={12}>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 0, textAlign: 'center' }}>
              © {currentYear} Serenity. All rights reserved.
            </Paragraph>
          </Col>
          <Col xs={24} sm={12}>
            <Space
              size="large"
              style={{
                justifyContent: 'center',
                width: '100%',
                display: 'flex',
              }}
            >
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    fontSize: '20px',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </Space>
          </Col>
        </Row>
      </div>
    </footer>
  );
};

export default Footer;
