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
  totalServices?: number;
  totalTherapists?: number;
  totalBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  totalRevenue?: number;
  mostBookedService?: string | null;
  topTherapist?: {
    id: string | null;
    name: string | null;
    bookings: number;
  };
  monthlyRevenue?: Array<{ month: string; revenue: number }>;
  // Detailed data fields
  services?: Array<{
    _id: string;
    name: string;
    price: number;
    duration?: number;
    description?: string;
  }>;
  therapists?: Array<{
    _id: string;
    name: string;
    specialization?: string;
    totalBookings?: number;
  }>;
  bookings?: Array<{
    _id: string;
    serviceName: string;
    customerName: string;
    therapistName: string;
    date: string;
    status: string;
    finalPrice: number;
  }>;
  revenueByService?: Array<{
    serviceName: string;
    bookings: number;
    revenue: number;
  }>;
}

const AVAILABLE_REPORT_FIELDS = [
  { key: 'totalServices', label: 'Total Services', icon: '🏢' },
  { key: 'totalTherapists', label: 'Total Therapists', icon: '👥' },
  { key: 'totalBookings', label: 'Total Bookings', icon: '📋' },
  { key: 'completedBookings', label: 'Completed Bookings', icon: '✅' },
  { key: 'cancelledBookings', label: 'Cancelled Bookings', icon: '❌' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: '💰' },
  { key: 'mostBookedService', label: 'Most Booked Service', icon: '⭐' },
  { key: 'topTherapist', label: 'Top Therapist', icon: '🏆' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: '📊' },
];

const BusinessReportPage = () => {
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
      
      const response = await fetch('/api/reports/business/custom', {
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
      
      // Send the report data to the custom PDF generation endpoint
      const response = await fetch('/api/reports/business/pdf', {
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
        link.download = `custom_business_report_${Date.now()}.pdf`;
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
      
      // Send the report data to the custom Excel generation endpoint
      const response = await fetch('/api/reports/business/excel', {
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
        link.download = `custom_business_report_${Date.now()}.xlsx`;
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
              Select report fields and click "Generate Report" to view your business analytics
            </Text>
          </div>
        </div>
      );
    }

    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Overview Statistics */}
        <Row gutter={[16, 16]}>
          {reportData.totalServices !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Services', reportData.totalServices, '🏢')}
            </Col>
          )}
          {reportData.totalTherapists !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Therapists', reportData.totalTherapists, '👥')}
            </Col>
          )}
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
          {reportData.totalRevenue !== undefined && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Revenue', `₹${reportData.totalRevenue.toFixed(2)}`, '💰')}
            </Col>
          )}
        </Row>

        {/* Most Booked Service & Top Therapist */}
        {(reportData.mostBookedService !== undefined || reportData.topTherapist !== undefined) && (
          <Row gutter={[16, 16]}>
            {reportData.mostBookedService !== undefined && (
              <Col xs={24} md={12}>
                <Card title="⭐ Most Booked Service">
                  <Text strong style={{ fontSize: '18px' }}>
                    {reportData.mostBookedService || 'N/A'}
                  </Text>
                </Card>
              </Col>
            )}
            {reportData.topTherapist !== undefined && reportData.topTherapist && (
              <Col xs={24} md={12}>
                <Card title="🏆 Top Therapist">
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Name: </Text>
                    <Text>{reportData.topTherapist.name || 'N/A'}</Text>
                  </div>
                  <div>
                    <Text strong>Total Bookings: </Text>
                    <Text>{reportData.topTherapist.bookings || 0}</Text>
                  </div>
                </Card>
              </Col>
            )}
          </Row>
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

        {/* Detailed Services Report */}
        {reportData.services && reportData.services.length > 0 && (
          <Card title="🏢 Detailed Services Report">
            <Table
              dataSource={reportData.services}
              columns={[
                {
                  title: 'Service Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price: number) => `₹${price.toFixed(2)}`,
                  sorter: (a, b) => a.price - b.price,
                },
                {
                  title: 'Duration (mins)',
                  dataIndex: 'duration',
                  key: 'duration',
                  render: (duration?: number) => duration ? `${duration} mins` : 'N/A',
                  sorter: (a, b) => (a.duration || 0) - (b.duration || 0),
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                  ellipsis: true,
                },
              ]}
              pagination={false}
              rowKey="_id"
              summary={(pageData) => {
                const totalRevenue = pageData.reduce((sum, service) => sum + service.price, 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalRevenue.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                      <Table.Summary.Cell index={3} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Detailed Therapists Report */}
        {reportData.therapists && reportData.therapists.length > 0 && (
          <Card title="👥 Detailed Therapists Report">
            <Table
              dataSource={reportData.therapists}
              columns={[
                {
                  title: 'Therapist Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Specialization',
                  dataIndex: 'specialization',
                  key: 'specialization',
                },
                {
                  title: 'Total Bookings',
                  dataIndex: 'totalBookings',
                  key: 'totalBookings',
                  render: (bookings?: number) => bookings || 0,
                  sorter: (a, b) => (a.totalBookings || 0) - (b.totalBookings || 0),
                },
              ]}
              pagination={false}
              rowKey="_id"
              summary={(pageData) => {
                const totalBookings = pageData.reduce((sum, therapist) => sum + (therapist.totalBookings || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} />
                      <Table.Summary.Cell index={2}>
                        <Text strong>{totalBookings}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Detailed Bookings Report */}
        {reportData.bookings && reportData.bookings.length > 0 && (
          <Card title="📋 Detailed Bookings Report">
            <Table
              dataSource={reportData.bookings}
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
                  title: 'Therapist',
                  dataIndex: 'therapistName',
                  key: 'therapistName',
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
                  title: 'Price',
                  dataIndex: 'finalPrice',
                  key: 'finalPrice',
                  render: (price: number) => `₹${price.toFixed(2)}`,
                  sorter: (a, b) => a.finalPrice - b.finalPrice,
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
              summary={(pageData) => {
                const totalPrice = pageData.reduce((sum, booking) => sum + booking.finalPrice, 0);
                const completedCount = pageData.filter(b => b.status.toLowerCase() === 'completed').length;
                const cancelledCount = pageData.filter(b => b.status.toLowerCase() === 'cancelled').length;
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Summary</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>{pageData.length} bookings</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong>✓ {completedCount} | ✗ {cancelledCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalPrice.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Revenue by Service Report */}
        {reportData.revenueByService && reportData.revenueByService.length > 0 && (
          <Card title="💰 Revenue by Service Analysis">
            <Table
              dataSource={reportData.revenueByService}
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
                  title: 'Total Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (revenue: number) => `₹${revenue.toFixed(2)}`,
                  sorter: (a, b) => a.revenue - b.revenue,
                  defaultSortOrder: 'descend',
                },
                {
                  title: 'Avg per Booking',
                  key: 'avgRevenue',
                  render: (_, record) => {
                    const avg = record.bookings > 0 ? record.revenue / record.bookings : 0;
                    return `₹${avg.toFixed(2)}`;
                  },
                  sorter: (a, b) => (a.revenue / a.bookings) - (b.revenue / b.bookings),
                },
              ]}
              pagination={false}
              rowKey="serviceName"
              summary={(pageData) => {
                const totalBookings = pageData.reduce((sum, item) => sum + item.bookings, 0);
                const totalRevenue = pageData.reduce((sum, item) => sum + item.revenue, 0);
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
                        <Text strong style={{ color: '#52c41a' }}>₹{totalRevenue.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>₹{(totalRevenue / totalBookings || 0).toFixed(2)}</Text>
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
              Business Reports
            </Title>
            <Text type="secondary">
              Generate customized reports for your business performance
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

export default BusinessReportPage;
