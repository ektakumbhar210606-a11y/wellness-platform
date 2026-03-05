'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Spin, 
  Empty,
  Space,
  Tag,
  Statistic,
  List,
  Avatar,
  Rate
} from 'antd';
import { 
  BarChartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  LineChartOutlined,
  TeamOutlined,
  RiseOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  averageRating: number;
  servicePerformance: Array<{ serviceName: string; bookings: number; revenue: number }>;
  therapistPerformance: Array<{ therapistName: string; sessions: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  monthlyBookings: Array<{ month: string; count: number }>;
  dailyBookings: Array<{ date: string; count: number }>;
  recentReviews: Array<{
    therapistName: string;
    customerName: string;
    serviceName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

const BusinessAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart colors palette
  const CHART_COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#43e97b', '#fa8bfd',
    '#faad14', '#13c2c2', '#eb2f96', '#52c41a', '#1890ff'
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          return;
        }

        const response = await fetch('/api/business/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data);
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          setError('Access denied. Business role required.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color,
    prefix,
    precision = 0
  }: { 
    title: string; 
    value: React.ReactNode; 
    icon: React.ReactNode;
    color: string;
    prefix?: string;
    precision?: number;
  }) => (
    <Card>
      <Space align="start" size="large">
        <div style={{ 
          backgroundColor: color, 
          borderRadius: '50%', 
          width: 56, 
          height: 56, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>{title}</Text>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
            {prefix && <span style={{ fontSize: '20px', marginRight: '4px' }}>{prefix}</span>}
            {typeof value === 'number' ? value.toFixed(precision) : value}
          </div>
        </div>
      </Space>
    </Card>
  );

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ 
            background: '#fff', 
            padding: '40px', 
            borderRadius: '8px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: '24px' }}>
              <Text>Loading your analytics...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px' }}>
          <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Empty 
              description={error}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </Content>
      </Layout>
    );
  }

  // Handle empty state - no bookings
  if (!analytics || analytics.totalBookings === 0) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px' }}>
          <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Empty 
              description="No booking data yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                Start receiving bookings to see your business analytics here!
              </Text>
            </Empty>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={2} style={{ marginBottom: '8px' }}>
              <BarChartOutlined style={{ marginRight: '12px', color: '#667eea' }} />
              Business Analytics
            </Title>
            <Text type="secondary">
              Comprehensive insights into your business performance
            </Text>
          </div>

          {/* Section 1: Overview Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Total Bookings" 
                value={analytics.totalBookings}
                icon={<ClockCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#667eea"
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Total Revenue" 
                value={(analytics.totalRevenue || 0).toFixed(2)}
                prefix="₹"
                icon={<DollarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#43e97b"
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Average Rating" 
                value={analytics.averageRating || 0}
                precision={1}
                icon={<StarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#faad14"
              />
            </Col>
          </Row>

          {/* Section 2: Booking Status Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Completed" 
                value={analytics.completedBookings}
                icon={<CheckCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#52c41a"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Confirmed" 
                value={analytics.confirmedBookings}
                icon={<CheckCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#1890ff"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Pending" 
                value={analytics.pendingBookings}
                icon={<ClockCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#faad14"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Cancelled" 
                value={analytics.cancelledBookings}
                icon={<CloseCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#ff4d4f"
              />
            </Col>
          </Row>

          {/* Section 3: Monthly Revenue Trend */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#43e97b' }} />
                    <span>Monthly Revenue Trend</span>
                  </Space>
                }
              >
                {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis 
                          tickFormatter={(value) => `₹${value.toFixed(0)}`}
                          label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(2)}`, 'Revenue']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Monthly Revenue" 
                          stroke="#43e97b" 
                          strokeWidth={3}
                          dot={{ fill: '#43e97b', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📈 Line Chart - Monthly Revenue Trend</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No revenue data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 4: Monthly Bookings Trend */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#667eea' }} />
                    <span>Monthly Bookings Trend</span>
                  </Space>
                }
              >
                {analytics.monthlyBookings && analytics.monthlyBookings.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.monthlyBookings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis allowDecimals={false} label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Bookings" 
                          stroke="#667eea" 
                          strokeWidth={3}
                          dot={{ fill: '#667eea', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📊 Line Chart - Monthly Bookings Trend</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No monthly bookings data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 5: Daily Activity (Last 30 Days) */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: '#13c2c2' }} />
                    <span>Daily Activity (Last 30 Days)</span>
                  </Space>
                }
              >
                {analytics.dailyBookings && analytics.dailyBookings.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.dailyBookings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          label={{ value: 'Date', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis allowDecimals={false} label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend />
                        <Bar name="Daily Bookings" dataKey="count" fill="#13c2c2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📅 Bar Chart - Daily Activity (Last 30 Days)</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No daily activity data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 6: Service Performance */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#f093fb' }} />
                    <span>Service Performance</span>
                  </Space>
                }
              >
                {analytics.servicePerformance && analytics.servicePerformance.length > 0 ? (
                  <div style={{ width: '100%', height: 450 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analytics.servicePerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.serviceName}: ${(entry.percent! * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="bookings"
                        >
                          {analytics.servicePerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>🥧 Pie Chart - Service Performance Distribution</Text>
                    </div>
                    
                    {/* Service breakdown table */}
                    <div style={{ marginTop: '24px' }}>
                      <Title level={5}>Service Breakdown</Title>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {analytics.servicePerformance.map((service) => {
                          const totalBookings = analytics.servicePerformance.reduce((sum, s) => sum + s.bookings, 0);
                          const percent = ((service.bookings / totalBookings) * 100).toFixed(1);
                          return (
                            <div key={service.serviceName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  backgroundColor: CHART_COLORS[analytics.servicePerformance.indexOf(service) % CHART_COLORS.length],
                                  borderRadius: '4px'
                                }} />
                                <Text strong>{service.serviceName}</Text>
                              </div>
                              <Space>
                                <Text>{service.bookings} bookings</Text>
                                <Text type="secondary">({percent}%)</Text>
                                <Text>₹{service.revenue.toFixed(2)}</Text>
                              </Space>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No service performance data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 7: Therapist Performance */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <TeamOutlined style={{ color: '#764ba2' }} />
                    <span>Therapist Performance</span>
                  </Space>
                }
              >
                {analytics.therapistPerformance && analytics.therapistPerformance.length > 0 ? (
                  <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.therapistPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="therapistName" angle={-15} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" orientation="left" allowDecimals={false} label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `₹${value.toFixed(0)}`} label={{ value: 'Revenue (₹)', angle: -90, position: 'insideRight' }} />
                        <Tooltip 
                          formatter={(value: number | undefined, name: string | undefined) => {
                            if (name === 'Revenue') {
                              return [`₹${(value || 0).toFixed(2)}`, 'Revenue'];
                            }
                            return [value ?? 0, 'Sessions'];
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" name="Sessions" dataKey="sessions" fill="#764ba2" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" name="Revenue" dataKey="revenue" fill="#f093fb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📊 Bar Chart - Therapist Performance (Sessions & Revenue)</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No therapist performance data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 8: Recent Reviews */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Recent Reviews</span>
                  </Space>
                }
              >
                {analytics.recentReviews && analytics.recentReviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {analytics.recentReviews.map((review, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: index < analytics.recentReviews.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <Avatar style={{ backgroundColor: CHART_COLORS[0] }}>
                          {review.customerName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '8px' }}>
                            <Space>
                              <Text strong>{review.customerName}</Text>
                              <Rate disabled defaultValue={review.rating} />
                              <Tag color="blue">{review.serviceName}</Tag>
                            </Space>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Text type="secondary">Therapist: {review.therapistName}</Text>
                            <Text>{review.comment}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    description="No reviews yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

        </div>
      </Content>
    </Layout>
  );
};

export default BusinessAnalyticsPage;
