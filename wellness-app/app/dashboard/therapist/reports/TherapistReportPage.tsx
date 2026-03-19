'use client';

import React, { useState } from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Checkbox, 
  Button, 
  Space,
  Divider,
  Statistic,
  Table,
  message,
  Spin
} from 'antd';
import { 
  DownloadOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined,
  BarChartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

interface ReportData {
  totalBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  totalEarnings?: number;
  totalServicesDone?: number;
  monthlyCancelCount?: number;
  bonusPenaltyPercentage?: number;
  // Detailed data fields
  recentBookings?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    date: string;
    status: string;
    earnings: number;
  }>;
  monthlyRevenue?: Array<{ month: string; revenue: number }>;
  serviceBreakdown?: Array<{
    serviceName: string;
    bookings: number;
    earnings: number;
  }>;
  // New detailed booking lists
  allBookingsDetails?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    date: string;
    time?: string;
    status: string;
    earnings: number;
    createdAt: string;
  }>;
  completedBookingsDetails?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    date: string;
    time?: string;
    status: string;
    earnings: number;
    createdAt: string;
  }>;
  cancelledBookingsDetails?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    date: string;
    time?: string;
    status: string;
    cancellationReason?: string;
    cancelledAt?: string;
    createdAt: string;
  }>;
  earningsDetails?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    date: string;
    bookingPrice: number;
    earnings: number;
    createdAt: string;
  }>;
  servicesDoneDetails?: Array<{
    serviceId: string;
    serviceName: string;
    count: number;
    earnings: number;
  }>;
}

const AVAILABLE_REPORT_FIELDS = [
  { key: 'totalBookings', label: 'Total Bookings Overview', icon: '📋' },
  { key: 'completedBookings', label: 'Completed Bookings Details', icon: '✅' },
  { key: 'cancelledBookings', label: 'Cancelled Bookings Details', icon: '❌' },
  { key: 'totalEarnings', label: 'Earnings Breakdown', icon: '💰' },
  { key: 'totalServicesDone', label: 'Services Performed Details', icon: '🎯' },
  { key: 'monthlyCancelCount', label: 'Monthly Cancellations Analysis', icon: '📅' },
  { key: 'bonusPenaltyPercentage', label: 'Bonus/Penalty %', icon: '🎁' },
  { key: 'recentBookings', label: 'Recent Bookings (Last 10)', icon: '📜' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue Trend', icon: '📊' },
  { key: 'serviceBreakdown', label: 'Service-wise Breakdown', icon: '📈' },
];

const TherapistReportPage = () => {
  const { user } = useAuth();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const handleCheckboxChange = (checkedValues: string[]) => {
    setSelectedFields(checkedValues);
  };

  const generateReport = async () => {
    if (selectedFields.length === 0) {
      message.warning('Please select at least one report field');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports/therapist/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedFields }),
      });

      if (response.ok) {
        const result = await response.json();
        setReportData(result.data);
        message.success('Report generated successfully!');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportData || Object.keys(reportData).length === 0) {
      message.warning('Please generate a report first');
      return;
    }

    try {
      setGeneratingPdf(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports/therapist/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom_therapist_report_${Date.now()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        message.success('PDF downloaded successfully!');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error('Failed to download PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadExcel = async () => {
    if (!reportData || Object.keys(reportData).length === 0) {
      message.warning('Please generate a report first');
      return;
    }

    try {
      setGeneratingExcel(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports/therapist/excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom_therapist_report_${Date.now()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        message.success('Excel downloaded successfully!');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to download Excel');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      message.error('Failed to download Excel');
    } finally {
      setGeneratingExcel(false);
    }
  };

  const renderStatCard = (title: string, value: any, icon?: string) => (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        styles={{ content: { fontWeight: 'bold' } }}
      />
    </Card>
  );

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <BarChartOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <div>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Select report fields and click "Generate Report" to view your performance analytics
            </Text>
          </div>
        </div>
      );
    }

    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Overview Statistics */}
        <Row gutter={[16, 16]}>
          {reportData.totalBookings !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Bookings', reportData.totalBookings, '📋')}
            </Col>
          )}
          {reportData.completedBookings !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Completed Bookings', reportData.completedBookings, '✅')}
            </Col>
          )}
          {reportData.cancelledBookings !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Cancelled Bookings', reportData.cancelledBookings, '❌')}
            </Col>
          )}
          {reportData.totalEarnings !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Earnings', `₹${reportData.totalEarnings?.toFixed(2)}`, '💰')}
            </Col>
          )}
          {reportData.totalServicesDone !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Services Performed', reportData.totalServicesDone, '🎯')}
            </Col>
          )}
          {reportData.monthlyCancelCount !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Monthly Cancellations', reportData.monthlyCancelCount, '📅')}
            </Col>
          )}
          {reportData.bonusPenaltyPercentage !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard(
                'Bonus/Penalty', 
                `${reportData.bonusPenaltyPercentage >= 0 ? '+' : ''}${reportData.bonusPenaltyPercentage}%`,
                reportData.bonusPenaltyPercentage >= 0 ? '🎁' : '⚠️'
              )}
            </Col>
          )}
        </Row>

        {/* All Bookings Detailed Table */}
        {reportData.allBookingsDetails && reportData.allBookingsDetails.length > 0 && (
          <Card title="📋 All Bookings - Detailed List">
            <Table
              dataSource={reportData.allBookingsDetails}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Date & Time',
                  dataIndex: 'date',
                  key: 'dateTime',
                  render: (_: any, record: any) => `${new Date(record.date).toLocaleDateString()} ${record.time || ''}`,
                  sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      completed: '#52c41a',
                      cancelled: '#ff4d4f',
                      pending: '#faad14',
                      confirmed: '#1890ff',
                    };
                    return (
                      <span style={{ color: colors[status.toLowerCase()] || '#666' }}>
                        {status.toUpperCase()}
                      </span>
                    );
                  },
                },
                {
                  title: 'Earnings',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
            />
          </Card>
        )}

        {/* Completed Bookings Detailed Table */}
        {reportData.completedBookingsDetails && reportData.completedBookingsDetails.length > 0 && (
          <Card title="✅ Completed Bookings - Detailed List">
            <Table
              dataSource={reportData.completedBookingsDetails}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Date & Time',
                  dataIndex: 'date',
                  key: 'dateTime',
                  render: (_: any, record: any) => `${new Date(record.date).toLocaleDateString()} ${record.time || ''}`,
                  sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                },
                {
                  title: 'Earnings',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
              summary={(pageData) => {
                const totalEarnings = pageData.reduce((sum, booking) => sum + booking.earnings, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total Earnings from Completed Bookings</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalEarnings.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Cancelled Bookings Detailed Table */}
        {reportData.cancelledBookingsDetails && reportData.cancelledBookingsDetails.length > 0 && (
          <Card title="❌ Cancelled Bookings - Detailed List">
            <Table
              dataSource={reportData.cancelledBookingsDetails}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date: string) => new Date(date).toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  }),
                  sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                },
                {
                  title: 'Cancellation Reason',
                  dataIndex: 'cancellationReason',
                  key: 'cancellationReason',
                  ellipsis: true,
                },
                {
                  title: 'Cancelled At',
                  dataIndex: 'cancelledAt',
                  key: 'cancelledAt',
                  render: (date?: string) => date ? new Date(date).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : 'N/A',
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
            />
          </Card>
        )}

        {/* Earnings Detailed Table */}
        {reportData.earningsDetails && reportData.earningsDetails.length > 0 && (
          <Card title="💰 Earnings Breakdown - Detailed List">
            <Table
              dataSource={reportData.earningsDetails}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date: string) => new Date(date).toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  }),
                  sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                },
                {
                  title: 'Booking Price',
                  dataIndex: 'bookingPrice',
                  key: 'bookingPrice',
                  render: (price: number) => `₹${price.toFixed(2)}`,
                },
                {
                  title: 'Your Earnings (70%)',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                  defaultSortOrder: 'descend',
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
              summary={(pageData) => {
                const totalPrice = pageData.reduce((sum, item) => sum + item.bookingPrice, 0);
                const totalEarnings = pageData.reduce((sum, item) => sum + item.earnings, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Totals</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text>₹{totalPrice.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalEarnings.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Services Done Detailed Table */}
        {reportData.servicesDoneDetails && reportData.servicesDoneDetails.length > 0 && (
          <Card title="🎯 Services Performed - Detailed Breakdown">
            <Table
              dataSource={reportData.servicesDoneDetails}
              columns={[
                {
                  title: 'Service Name',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Total Count',
                  dataIndex: 'count',
                  key: 'count',
                  sorter: (a, b) => a.count - b.count,
                },
                {
                  title: 'Total Earnings',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                  defaultSortOrder: 'descend',
                },
                {
                  title: 'Avg per Service',
                  key: 'avgEarnings',
                  render: (_, record) => {
                    const avg = record.count > 0 ? record.earnings / record.count : 0;
                    return `₹${avg.toFixed(2)}`;
                  },
                },
              ]}
              pagination={false}
              rowKey="serviceId"
              summary={(pageData) => {
                const totalCount = pageData.reduce((sum, item) => sum + item.count, 0);
                const totalEarnings = pageData.reduce((sum, item) => sum + item.earnings, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{totalCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalEarnings.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>₹{(totalEarnings / totalCount || 0).toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Monthly Revenue Table */}
        {reportData.monthlyRevenue && reportData.monthlyRevenue.length > 0 && (
          <Card title="📊 Monthly Revenue">
            <Table
              dataSource={reportData.monthlyRevenue}
              columns={[
                {
                  title: 'Month',
                  dataIndex: 'month',
                  key: 'month',
                  render: (month: string) => new Date(month).toLocaleString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }),
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (revenue: number) => `₹${revenue.toFixed(2)}`,
                  sorter: (a, b) => a.revenue - b.revenue,
                },
              ]}
              pagination={false}
              rowKey="month"
            />
          </Card>
        )}

        {/* Recent Bookings Report */}
        {reportData.recentBookings && reportData.recentBookings.length > 0 && (
          <Card title="📜 Recent Bookings">
            <Table
              dataSource={reportData.recentBookings}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  render: (date: string) => new Date(date).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                  sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      completed: '#52c41a',
                      cancelled: '#ff4d4f',
                      pending: '#faad14',
                      confirmed: '#1890ff',
                    };
                    return (
                      <span style={{ color: colors[status.toLowerCase()] || '#666' }}>
                        {status.toUpperCase()}
                      </span>
                    );
                  },
                },
                {
                  title: 'Earnings',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                },
              ]}
              pagination={false}
              rowKey="_id"
              summary={(pageData) => {
                const totalEarnings = pageData.reduce((sum, booking) => sum + booking.earnings, 0);
                const completedCount = pageData.filter(b => b.status.toLowerCase() === 'completed').length;
                const cancelledCount = pageData.filter(b => b.status.toLowerCase() === 'cancelled').length;
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>Summary</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>{pageData.length} bookings</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>✓ {completedCount} | ✗ {cancelledCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalEarnings.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Service Breakdown Report */}
        {reportData.serviceBreakdown && reportData.serviceBreakdown.length > 0 && (
          <Card title="📈 Service Breakdown Analysis">
            <Table
              dataSource={reportData.serviceBreakdown}
              columns={[
                {
                  title: 'Service Name',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Total Bookings',
                  dataIndex: 'bookings',
                  key: 'bookings',
                  sorter: (a, b) => a.bookings - b.bookings,
                },
                {
                  title: 'Total Earnings',
                  dataIndex: 'earnings',
                  key: 'earnings',
                  render: (earnings: number) => `₹${earnings.toFixed(2)}`,
                  sorter: (a, b) => a.earnings - b.earnings,
                  defaultSortOrder: 'descend',
                },
                {
                  title: 'Avg per Booking',
                  key: 'avgEarnings',
                  render: (_, record) => {
                    const avg = record.bookings > 0 ? record.earnings / record.bookings : 0;
                    return `₹${avg.toFixed(2)}`;
                  },
                  sorter: (a, b) => (a.earnings / a.bookings) - (b.earnings / b.bookings),
                },
              ]}
              pagination={false}
              rowKey="serviceName"
              summary={(pageData) => {
                const totalBookings = pageData.reduce((sum, item) => sum + item.bookings, 0);
                const totalEarnings = pageData.reduce((sum, item) => sum + item.earnings, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{totalBookings}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalEarnings.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>₹{(totalEarnings / totalBookings || 0).toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}
      </Space>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '24px' }}>
            <Title level={2} style={{ marginBottom: '8px' }}>
              <BarChartOutlined style={{ marginRight: '12px', color: '#667eea' }} />
              Therapist Performance Reports
            </Title>
            <Text type="secondary">
              Generate customized reports for your professional performance
            </Text>
          </div>

          {/* Field Selection Card */}
          <Card 
            title="Select Report Fields"
            style={{ marginBottom: '24px' }}
          >
            <Checkbox.Group onChange={handleCheckboxChange} value={selectedFields}>
              <Row gutter={[16, 16]}>
                {AVAILABLE_REPORT_FIELDS.map((field) => (
                  <Col xs={24} sm={12} md={8} key={field.key}>
                    <Checkbox value={field.key} style={{ fontSize: '16px' }}>
                      <Space>
                        <span>{field.icon}</span>
                        <span>{field.label}</span>
                      </Space>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>

            <Divider />

            <Space>
              <Button 
                type="primary" 
                size="large"
                onClick={generateReport}
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Generate Report
              </Button>
              <Button
                size="large"
                onClick={downloadPDF}
                loading={generatingPdf}
                icon={<FilePdfOutlined />}
                disabled={!reportData}
              >
                Download PDF
              </Button>
              <Button
                size="large"
                onClick={downloadExcel}
                loading={generatingExcel}
                icon={<FileExcelOutlined />}
                disabled={!reportData}
              >
                Download Excel
              </Button>
            </Space>
          </Card>

          {/* Report Display Card */}
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>Generating your report...</Text>
                </div>
              </div>
            ) : (
              renderReportContent()
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default TherapistReportPage;
