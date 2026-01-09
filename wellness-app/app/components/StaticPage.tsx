'use client';

import { Layout, Typography, Row, Col, Card, Breadcrumb, Button } from 'antd';
import { useParams, usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import staticContentData from '../data/static-content-data';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

const StaticPage = () => {
  const pathname = usePathname();
  // Extract the page key from the pathname
  const pageKey = pathname.split('/').pop()?.replace(/-/g, '-') || '';

  // Find content based on the page key
  const content = staticContentData[pageKey as keyof typeof staticContentData];

  // Format the page key for display in breadcrumbs
  const formatBreadcrumbLabel = (key: string) => {
    return key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!content) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Layout.Content style={{ padding: '24px', marginTop: 64 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
            <Title level={1} style={{ color: '#ff4d4f', marginBottom: 24 }}>Page Not Found</Title>
            <Paragraph style={{ fontSize: '16px', marginBottom: 24 }}>
              Sorry, the page you are looking for does not exist.
            </Paragraph>
            <Link href="/">
              <Button type="primary">Return to Home</Button>
            </Link>
          </div>
        </Layout.Content>
        <Footer />
      </Layout>
    );
  }

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
              { title: formatBreadcrumbLabel(pageKey) }
            ]}
          />
          
          {/* Page Title and Description */}
          <Title level={1} style={{ textAlign: 'center', marginBottom: 16, color: '#667eea' }}>
            {content.title}
          </Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '16px', color: '#666', marginBottom: 40 }}>
            {content.description}
          </Paragraph>
          
          {/* Content Sections */}
          <Row gutter={[24, 24]}>
            {content.sections.map((section, index) => (
              <Col xs={24} key={index}>
                <Card 
                  style={{ 
                    borderRadius: 8, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minHeight: 200
                  }}
                >
                  <Title level={3} style={{ color: '#262626', marginBottom: 16 }}>
                    {section.title}
                  </Title>
                  <Paragraph style={{ fontSize: '15px', lineHeight: 1.8 }}>
                    {section.content}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Layout.Content>
      <Footer />
    </Layout>
  );
};

export default StaticPage;