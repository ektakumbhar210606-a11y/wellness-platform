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
  Progress,
  Statistic,
  List,
  Avatar
} from 'antd';
import { 
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LineChartOutlined
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
import { useAuth } from '@/app/context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AnalyticsData {
  totalBookings: number;
  totalCompletedBookings: number;
  totalSpent: number;
  mostBookedService: string | null;
  serviceBreakdown: Array<{ service: string; count: number }>;
  therapistBreakdown: Array<{ therapistName: string; count: number }>;
  monthlyBookings: Array<{ month: string; count: number }>;
  monthlySpending: Array<{ month: string; total: number }>;
  dailyBookings: Array<{ day: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number; spending: number }>;
}

const CustomerAnalyticsPage = () => {
  const { user } = useAuth();
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

        const response = await fetch('/api/customer/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          setError('Access denied. Customer role required.');
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
    prefix 
  }: { 
    title: string; 
    value: React.ReactNode; 
    icon: React.ReactNode;
    color: string;
    prefix?: string;
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
            {value}
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
              description="No booking history yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                Start booking wellness services to see your analytics here!
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
              Your Wellness Analytics
            </Title>
            <Text type="secondary">
              Visual insights into your wellness journey
            </Text>
          </div>

          {/* Section 1: Overview Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Total Bookings" 
                value={analytics.totalBookings}
                icon={<CalendarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#667eea"
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Completed Sessions" 
                value={analytics.totalCompletedBookings}
                icon={<CheckCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#43e97b"
              />
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <StatCard 
                title="Total Spent" 
                value={(analytics.totalSpent || 0).toFixed(2)}
                prefix="$"
                icon={<DollarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#fa8bfd"
              />
            </Col>
          </Row>

          {/* Section 2: Bar Chart - Services Usage */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <span>Services Usage Distribution</span>
                  </Space>
                }
              >
                {analytics.serviceBreakdown.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.serviceBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="service" angle={-15} textAnchor="end" height={80} />
                        <YAxis allowDecimals={false} label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="Number of Bookings" dataKey="count" fill="#667eea">
                          {analytics.serviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📊 Bar Chart - Services Usage Distribution</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No service data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 3: Daily Activity Pattern - Day of Week */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <CalendarOutlined style={{ color: '#13c2c2' }} />
                    <span>Weekly Activity Pattern</span>
                  </Space>
                }
              >
                {analytics.dailyBookings && analytics.dailyBookings.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.dailyBookings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" angle={-15} textAnchor="end" height={80} />
                        <YAxis allowDecimals={false} label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="Daily Bookings" dataKey="count" fill="#13c2c2">
                          {analytics.dailyBookings.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 5) % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📅 Bar Chart - Weekly Activity Pattern (Day-wise)</Text>
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

          {/* Section 3: Pie Chart - Therapist Distribution */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <UserOutlined style={{ color: '#43e97b' }} />
                    <span>Therapist Sessions Distribution</span>
                  </Space>
                }
              >
                {analytics.therapistBreakdown.length > 0 ? (
                  <div style={{ width: '100%', height: 450 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analytics.therapistBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.therapistBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>🥧 Pie Chart - Therapist Session Distribution</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No therapist data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 4: Line Chart - Monthly Booking Trend */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#667eea' }} />
                    <span>Monthly Booking Trend</span>
                  </Space>
                }
              >
                {analytics.monthlyBookings.length > 0 ? (
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
                          stroke="#43e97b" 
                          strokeWidth={3}
                          dot={{ fill: '#43e97b', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📈 Line Chart - Monthly Booking Trends</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No monthly trend data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 5: Daily Bookings Trend */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: '#eb2f96' }} />
                    <span>Daily Activity Timeline</span>
                  </Space>
                }
              >
                {analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          label={{ value: 'Date', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis allowDecimals={false} label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Daily Bookings" 
                          stroke="#eb2f96" 
                          strokeWidth={2}
                          dot={{ fill: '#eb2f96', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📅 Line Chart - Daily Activity Timeline (Date-wise)</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No daily timeline data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Section 6: Bar Chart - Monthly Spending */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <DollarOutlined style={{ color: '#fa8bfd' }} />
                    <span>Monthly Spending Pattern</span>
                  </Space>
                }
              >
                {analytics.monthlySpending.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.monthlySpending}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis 
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          label={{ value: 'Amount Spent ($)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, 'Amount Spent']}
                        />
                        <Legend />
                        <Bar name="Monthly Spending" dataKey="total" fill="#fa8bfd" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>💰 Bar Chart - Monthly Spending Patterns</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No spending data available"
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

export default CustomerAnalyticsPage;
