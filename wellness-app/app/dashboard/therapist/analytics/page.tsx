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
  Statistic,
  Progress
} from 'antd';
import { 
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  TeamOutlined,
  MessageOutlined
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
import { therapistApi } from '@/app/utils/apiUtils';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AnalyticsData {
  totalSessionsCompleted: number;
  totalEarnings: number;
  averageRating: number;
  monthlyBonusEarned: number;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
  monthlySessions: Array<{ month: string; sessions: number }>;
  monthlyRatings: Array<{ month: string; avgRating: number }>;
  serviceDistribution: Array<{ serviceName: string; totalSessions: number }>;
  monthlyReviewCount: Array<{ month: string; reviewCount: number }>;
}

const TherapistAnalyticsPage = () => {
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
        
        const response = await therapistApi.getAnalytics();
        
        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          setError(response.error || 'Failed to load analytics');
        }
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Network error. Please check your connection and try again.');
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

  // Handle empty state - no data
  if (!analytics || analytics.totalSessionsCompleted === 0) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px' }}>
          <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Empty 
              description="No analytics data available yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                Start accepting bookings to see your practice analytics here!
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
              Practice Analytics
            </Title>
            <Text type="secondary">
              Comprehensive insights into your therapy practice performance
            </Text>
          </div>

          {/* SECTION 1: Summary Cards (Top 4 Cards) */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Total Sessions Completed" 
                value={analytics.totalSessionsCompleted}
                icon={<CheckCircleOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#43e97b"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Total Earnings" 
                value={(analytics.totalEarnings || 0).toFixed(2)}
                prefix="$"
                icon={<DollarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#667eea"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Average Rating" 
                value={analytics.averageRating || 0}
                precision={1}
                icon={<StarOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#faad14"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard 
                title="Monthly Bonus Earned" 
                value={(analytics.monthlyBonusEarned || 0).toFixed(2)}
                prefix="$"
                icon={<TrophyOutlined style={{ fontSize: '28px', color: 'white' }} />}
                color="#f093fb"
              />
            </Col>
          </Row>

          {/* SECTION 2: Monthly Earnings Trend */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <DollarOutlined style={{ color: '#667eea' }} />
                    <span>Monthly Earnings Trend</span>
                  </Space>
                }
              >
                {analytics.monthlyEarnings && analytics.monthlyEarnings.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.monthlyEarnings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis 
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          label={{ value: 'Earnings ($)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, 'Earnings']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          name="Monthly Earnings" 
                          stroke="#667eea" 
                          strokeWidth={3}
                          dot={{ fill: '#667eea', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📈 Line Chart - Monthly Earnings Trend</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No earnings data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* SECTION 3: Completed Sessions Per Month */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <TeamOutlined style={{ color: '#43e97b' }} />
                    <span>Completed Sessions Per Month</span>
                  </Space>
                }
              >
                {analytics.monthlySessions && analytics.monthlySessions.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.monthlySessions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis allowDecimals={false} label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="Completed Sessions" dataKey="sessions" fill="#43e97b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📊 Bar Chart - Completed Sessions Per Month</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No session data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* SECTION 4: Rating Trend Per Month */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Rating Trend Per Month</span>
                  </Space>
                }
              >
                {analytics.monthlyRatings && analytics.monthlyRatings.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.monthlyRatings}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis 
                          domain={[0, 5]}
                          label={{ value: 'Average Rating', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number | undefined) => [(value || 0).toFixed(2), 'Avg Rating']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="avgRating" 
                          name="Average Rating" 
                          stroke="#faad14" 
                          strokeWidth={3}
                          dot={{ fill: '#faad14', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📈 Line Chart - Rating Trend Per Month</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No rating data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* SECTION 5: Service Distribution */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#f093fb' }} />
                    <span>Service Distribution</span>
                  </Space>
                }
              >
                {analytics.serviceDistribution && analytics.serviceDistribution.length > 0 ? (
                  <div style={{ width: '100%', height: 450 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analytics.serviceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.serviceName}: ${(entry.percent! * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="totalSessions"
                        >
                          {analytics.serviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>🥧 Pie Chart - Service Distribution</Text>
                    </div>
                    
                    {/* Service legend with percentages */}
                    <div style={{ marginTop: '24px' }}>
                      <Title level={5}>Service Breakdown</Title>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {analytics.serviceDistribution.map((service, index) => {
                          const percentage = analytics.serviceDistribution.reduce((sum, s) => sum + s.totalSessions, 0);
                          const percent = ((service.totalSessions / percentage) * 100).toFixed(1);
                          return (
                            <div key={service.serviceName} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                borderRadius: '4px'
                              }} />
                              <Text strong>{service.serviceName}</Text>
                              <Text type="secondary">– {service.totalSessions} sessions</Text>
                              <Text type="secondary">({percent}%)</Text>
                            </div>
                          );
                        })}
                      </Space>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No service distribution data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* SECTION 6: Monthly Reviews Count */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <MessageOutlined style={{ color: '#13c2c2' }} />
                    <span>Monthly Reviews Count</span>
                  </Space>
                }
              >
                {analytics.monthlyReviewCount && analytics.monthlyReviewCount.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={analytics.monthlyReviewCount}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                        <YAxis allowDecimals={false} label={{ value: 'Reviews', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="Monthly Reviews" dataKey="reviewCount" fill="#13c2c2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '14px' }}>📊 Bar Chart - Monthly Reviews Count</Text>
                    </div>
                  </div>
                ) : (
                  <Empty 
                    description="No review data available"
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

export default TherapistAnalyticsPage;
