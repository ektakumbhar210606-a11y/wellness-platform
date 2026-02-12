'use client';

import React, { use } from 'react';
import { Card, Typography, Breadcrumb, Button } from 'antd';
import { HomeOutlined, ShopOutlined, LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
// Note: notFound() is primarily for Server Components. 
// For Client Components, simple conditional rendering or router.push('/404') is common, 
// but we'll stick to basic rendering here to avoid complexity.

const { Title, Paragraph, Text } = Typography;

// Define Props interface for Next.js 16+ App Router Page
interface BusinessPageProps {
    params: Promise<{
        businessId: string;
    }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function BusinessDetailsPage({ params }: BusinessPageProps) {
    // Unwrap params using React.use() for Next.js 16+
    const resolvedParams = use(params);
    const { businessId } = resolvedParams;
    const router = useRouter();

    if (!businessId) {
        return (
            <div style={{ padding: '24px' }}>
                <Title level={4}>Invalid Business ID</Title>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            {/* Breadcrumb Navigation */}
            <div style={{ marginBottom: 16 }}>
                <Breadcrumb
                    items={[
                        {
                            title: <a onClick={() => router.push('/dashboard/customer')}><HomeOutlined /> Dashboard</a>,
                        },
                        {
                            title: <a onClick={() => router.push('/dashboard/customer/search')}><ShopOutlined /> Businesses</a>,
                        },
                        {
                            title: `Business Details`,
                        },
                    ]}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <Button
                    icon={<LeftOutlined />}
                    onClick={() => router.back()}
                    style={{ marginBottom: 16 }}
                >
                    Back
                </Button>
                <Title level={2} style={{ margin: 0 }}>Business Profile</Title>
                <Text type="secondary">Viewing details for Business ID: {businessId}</Text>
            </div>

            <Card title="Business Overview" bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <Paragraph>
                    Welcome to the details page for business <strong>{businessId}</strong>.
                </Paragraph>
                <Paragraph>
                    This page is ready to be populated with real business data fetched using the ID.
                </Paragraph>
                <div style={{ marginTop: 24, padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
                    <Title level={5}>Developer Note:</Title>
                    <Paragraph>
                        This template uses Next.js 16 App Router syntax with <code>React.use()</code> to handle async params.
                        Replace this placeholder content with your actual data fetching logic (e.g., <code>useEffect</code> or a custom hook).
                    </Paragraph>
                </div>
            </Card>
        </div>
    );
}
