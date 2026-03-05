'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Rate, 
  Typography, 
  Space, 
  Spin, 
  Alert,
  Row,
  Col,
  Divider,
  Pagination,
  Select,
  Badge,
  Tabs,
  Table,
  Tag,
  Statistic
} from 'antd';
import { StarOutlined, UserOutlined, CalendarOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface Review {
  rating: number;
  comment?: string;
  customerName: string;
  serviceName: string;
  createdAt: Date;
}

interface Bonus {
  id: string;
  businessId: string;
  businessName: string;
  month: number;
  year: number;
  averageRating: number;
  totalReviews: number;
  bonusAmount: number;
  status: 'pending' | 'paid';
  createdAt: Date;
}

interface TherapistStats {
  averageRating: number;
  totalReviews: number;
}

interface MonthlyPerformanceData {
  success: boolean;
  averageRating: number;
  totalReviews: number;
}

const TherapistReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<TherapistStats>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Bonus States
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('reviews');

  // Monthly Performance States
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformanceData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Current month
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()); // Current year

  // Get last 3 years for dropdown
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    fetchReviews();
    fetchMonthlyPerformance(selectedMonth, selectedYear);
    fetchBonuses();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest('/api/therapist/reviews');
      
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setStats(response.data.therapist || { averageRating: 0, totalReviews: 0 });
      } else {
        setError(response.error || 'Failed to fetch reviews');
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyPerformance = async (month: number, year: number) => {
    try {
      setMonthlyLoading(true);
      setMonthlyError(null);
      
      const response = await makeAuthenticatedRequest(`/api/therapist/reviews/monthly-performance?month=${month}&year=${year}`);
      
      if (response.success) {
        setMonthlyData({
          success: true,
          averageRating: response.monthlyAverageRating,
          totalReviews: response.monthlyTotalReviews
        });
      } else {
        setMonthlyError(response.error || 'Failed to fetch monthly performance');
      }
    } catch (err: any) {
      console.error('Error fetching monthly performance:', err);
      setMonthlyError(err.message || 'Failed to fetch monthly performance');
    } finally {
      setMonthlyLoading(false);
    }
  };

  const fetchBonuses = async () => {
    try {
      setBonusLoading(true);
      setBonusError(null);
      
      const response = await makeAuthenticatedRequest('/api/therapist/bonuses');
      
      if (response.success) {
        setBonuses(response.bonuses || []);
      } else {
        setBonusError(response.error || 'Failed to fetch bonuses');
      }
    } catch (err: any) {
      console.error('Error fetching bonuses:', err);
      setBonusError(err.message || 'Failed to fetch bonuses');
    } finally {
      setBonusLoading(false);
    }
  };

  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
    fetchMonthlyPerformance(value, selectedYear);
  };

  const handleYearChange = (value: number) => {
    setSelectedYear(value);
    fetchMonthlyPerformance(selectedMonth, value);
  };

  const bonusColumns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      sorter: (a: Bonus, b: Bonus) => a.businessName.localeCompare(b.businessName),
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month: number, record: Bonus) => (
        <span>
          {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {record.year}
        </span>
      ),
      sorter: (a: Bonus, b: Bonus) => (a.month + a.year * 100) - (b.month + b.year * 100),
    },
    {
      title: 'Rating',
      dataIndex: 'averageRating',
      key: 'averageRating',
      render: (rating: number) => (
        <span style={{ fontWeight: 'bold', color: rating >= 4.0 ? '#52c41a' : '#ff4d4f' }}>
          {rating ? rating.toFixed(2) : '0.00'} ⭐
        </span>
      ),
      sorter: (a: Bonus, b: Bonus) => (a.averageRating || 0) - (b.averageRating || 0),
    },
    {
      title: 'Reviews',
      dataIndex: 'totalReviews',
      key: 'totalReviews',
      sorter: (a: Bonus, b: Bonus) => (a.totalReviews || 0) - (b.totalReviews || 0),
    },
    {
      title: 'Bonus Amount',
      dataIndex: 'bonusAmount',
      key: 'bonusAmount',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          ₹{amount ? amount.toLocaleString('en-IN') : '0'}
        </span>
      ),
      sorter: (a: Bonus, b: Bonus) => (a.bonusAmount || 0) - (b.bonusAmount || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'pending' | 'paid') => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Paid', value: 'paid' },
      ],
      onFilter: (value: any, record: Bonus) => record.status === value,
    },
    {
      title: 'Received Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Bonus, b: Bonus) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const renderReviewItem = (review: Review) => (
    <Card 
      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '16px' }}
      styles={{ body: { padding: '20px' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Customer and Service Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <Text strong style={{ fontSize: '16px' }}>{review.customerName}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: '14px' }}>Service: {review.serviceName}</Text>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <Rate 
              disabled 
              value={review.rating} 
              style={{ fontSize: '18px' }}
            />
          </div>
        </div>
        
        {/* Comment */}
        {review.comment && (
          <div style={{ 
            backgroundColor: '#fafafa', 
            padding: '12px', 
            borderRadius: '6px',
            borderLeft: '3px solid #1890ff'
          }}>
            <Text style={{ fontSize: '14px', lineHeight: '1.5' }}>"{review.comment}"</Text>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading reviews...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Error Loading Reviews"
          description={error}
          type="error"
          showIcon
          action={
            <a onClick={fetchReviews} style={{ cursor: 'pointer' }}>
              Retry
            </a>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px', color: '#1d3557' }}>
        Reviews & Bonuses
      </Title>
      
      {/* Tabs for Reviews and Bonuses */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'reviews',
            label: (
              <span>
                <StarOutlined />
                Reviews
              </span>
            ),
            children: (
              <div>
                {/* Statistics Summary - Clean Top Display */}
                <div style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} sm={12}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <StarOutlined style={{ fontSize: '48px', color: '#faad14' }} />
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1d3557', marginBottom: '4px' }}>
                          {stats.averageRating.toFixed(1)}
                        </div>
                        <Text type="secondary" style={{ fontSize: '16px' }}>
                          Average Rating
                        </Text>
                      </div>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                          {stats.totalReviews}
                        </div>
                        <Text type="secondary" style={{ fontSize: '16px' }}>
                          Total Reviews
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Monthly Performance Section */}
                <div style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <Title level={3} style={{ marginBottom: '20px', color: '#1d3557' }}>
                    Monthly Performance
                  </Title>
                  
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>Month</Text>
                      <Select 
                        value={selectedMonth} 
                        onChange={handleMonthChange} 
                        style={{ minWidth: '120px' }}
                        disabled={monthlyLoading}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                          <Option key={month} value={month}>
                            {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                          </Option>
                        ))}
                      </Select>
                    </div>
                    
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>Year</Text>
                      <Select 
                        value={selectedYear} 
                        onChange={handleYearChange} 
                        style={{ minWidth: '100px' }}
                        disabled={monthlyLoading}
                      >
                        {years.map(year => (
                          <Option key={year} value={year}>{year}</Option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {monthlyLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>
                        <Text>Loading monthly performance...</Text>
                      </div>
                    </div>
                  ) : monthlyError ? (
                    <div style={{ padding: '20px' }}>
                      <Alert
                        message="Error Loading Monthly Performance"
                        description={monthlyError}
                        type="error"
                        showIcon
                        action={
                          <a onClick={() => fetchMonthlyPerformance(selectedMonth, selectedYear)} style={{ cursor: 'pointer' }}>
                            Retry
                          </a>
                        }
                      />
                    </div>
                  ) : monthlyData ? (
                    <Row gutter={[24, 24]} align="middle">
                      <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <StarOutlined style={{ fontSize: '48px', color: '#faad14' }} />
                          </div>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1d3557', marginBottom: '4px' }}>
                            {(monthlyData.averageRating || 0).toFixed(1)}
                          </div>
                          <Text type="secondary" style={{ fontSize: '16px' }}>
                            Monthly Average Rating
                          </Text>
                        </div>
                      </Col>
                      
                      <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                            {monthlyData.totalReviews || 0}
                          </div>
                          <Text type="secondary" style={{ fontSize: '16px' }}>
                            Total Reviews This Month
                          </Text>
                          
                          {/* Eligibility Badge */}
                          <div style={{ marginTop: '12px' }}>
                            {(monthlyData.averageRating || 0) >= 4.0 ? (
                              <Badge 
                                status="success" 
                                text="Eligible for Monthly Bonus 🎉" 
                                style={{ 
                                  padding: '6px 12px', 
                                  borderRadius: '6px', 
                                  backgroundColor: '#f6ffed', 
                                  border: '1px solid #b7eb8f',
                                  color: '#52c41a',
                                  fontWeight: 'bold'
                                }} 
                              />
                            ) : (
                              <Text type="secondary">
                                Not eligible this month
                              </Text>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text>No monthly performance data available</Text>
                    </div>
                  )}
                </div>

                <Divider style={{ margin: '24px 0' }} />

                {/* Reviews List */}
                <div>
                  <Title level={4} style={{ marginBottom: '16px', color: '#1d3557' }}>
                    Recent Reviews
                  </Title>
                  
                  {reviews.length > 0 ? (
                    <div>
                      {reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((review, index) => (
                        <div key={index}>
                          {renderReviewItem(review)}
                        </div>
                      ))}
                      {reviews.length > pageSize && (
                        <Pagination
                          current={currentPage}
                          total={reviews.length}
                          pageSize={pageSize}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} reviews`}
                          style={{ marginTop: '20px', textAlign: 'center' }}
                          onChange={(page, pageSize) => {
                            setCurrentPage(page);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <StarOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
                      <Title level={4} style={{ marginBottom: '12px' }}>No Reviews Yet</Title>
                      <Text type="secondary" style={{ fontSize: '16px' }}>
                        You don't have any reviews yet. Reviews will appear here after customers complete their bookings.
                      </Text>
                    </Card>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'bonuses',
            label: (
              <span>
                <GiftOutlined />
                Bonuses
                {bonuses.length > 0 && (
                  <Badge count={bonuses.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            ),
            children: (
              <div>
                {/* Bonus Summary Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic 
                        title="Total Bonuses" 
                        value={bonuses.length} 
                        prefix={<GiftOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic 
                        title="Paid" 
                        value={bonuses.filter(b => b.status === 'paid').length} 
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic 
                        title="Pending" 
                        value={bonuses.filter(b => b.status === 'pending').length} 
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Bonus Table */}
                <Card>
                  <Title level={4} style={{ marginBottom: '16px', color: '#1d3557' }}>
                    Bonus Payment History
                  </Title>
                  
                  {bonusLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>
                        <Text>Loading bonuses...</Text>
                      </div>
                    </div>
                  ) : bonusError ? (
                    <Alert
                      message="Error Loading Bonuses"
                      description={bonusError}
                      type="error"
                      showIcon
                      action={
                        <a onClick={fetchBonuses} style={{ cursor: 'pointer' }}>
                          Retry
                        </a>
                      }
                    />
                  ) : bonuses.length > 0 ? (
                    <Table 
                      dataSource={bonuses} 
                      columns={bonusColumns} 
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bonuses`
                      }}
                      scroll={{ x: 800 }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <GiftOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
                      <Title level={4} style={{ marginBottom: '12px' }}>No Bonuses Yet</Title>
                      <Text type="secondary" style={{ fontSize: '16px' }}>
                        You haven't received any bonuses yet. Bonuses will appear here when businesses pay you for excellent performance.
                      </Text>
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default TherapistReviews;