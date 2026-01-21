'use client';

import { Layout, Typography, Row, Col, Card, Breadcrumb, Button } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

export default function ServicesPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <Breadcrumb 
            style={{ marginBottom: 24 }} 
            items={[
              { title: <Link href="/">Home</Link> },
              { title: "Services" }
            ]}
          />
          
          {/* Page Title and Description */}
          <Title level={1} style={{ textAlign: 'center', marginBottom: 16, color: '#667eea' }}>
            Our Services
          </Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '16px', color: '#666', marginBottom: 40 }}>
            Discover our range of wellness services
          </Paragraph>
          
          {/* Service Cards */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: 16 }}>🧖‍♀️</div>
                  <Title level={3} style={{ color: '#262626', marginBottom: 16 }}>
                    Spa Services
                  </Title>
                  <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    Indulge in our luxurious spa treatments designed to relax and rejuvenate your body and mind.
                  </Paragraph>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: 16 }}>💆‍♂️</div>
                  <Title level={3} style={{ color: '#262626', marginBottom: 16 }}>
                    Massage Therapy
                  </Title>
                  <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    Experience therapeutic massage sessions tailored to your specific needs and preferences.
                  </Paragraph>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: 16 }}>🧘‍♀️</div>
                  <Title level={3} style={{ color: '#262626', marginBottom: 16 }}>
                    Wellness Programs
                  </Title>
                  <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    Join our comprehensive wellness programs to improve your health and wellbeing.
                  </Paragraph>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                style={{ 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: 16 }}>🏢</div>
                  <Title level={3} style={{ color: '#262626', marginBottom: 16 }}>
                    Corporate Wellness
                  </Title>
                  <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    Transform your workplace with our corporate wellness solutions and employee health programs.
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Layout.Content>
      <Footer />
    </Layout>
  );
}
