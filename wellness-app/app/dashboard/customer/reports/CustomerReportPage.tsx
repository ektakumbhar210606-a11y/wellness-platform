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
  totalSpent?: number;
  totalDiscountUsed?: number;
  mostBookedService?: string | null;
  // Detailed booking data
  bookings?: Array<{
    _id: string;
    serviceName: string;
    therapistName: string;
    date: string;
    time: string;
    status: string;
    finalPrice: number;
    discountApplied: boolean;
  }>;
  monthlyBookings?: Array<{ month: string; bookings: number; spent: number }>;
  serviceHistory?: Array<{
    serviceName: string;
    bookings: number;
    totalSpent: number;
    lastBooking: string;
  }>;
}

const AVAILABLE_REPORT_FIELDS = [
  { key: 'totalBookings', label: 'Total Bookings', icon: '📋' },
  { key: 'completedBookings', label: 'Completed Bookings', icon: '✅' },
  { key: 'cancelledBookings', label: 'Cancelled Bookings', icon: '❌' },
  { key: 'totalSpent', label: 'Total Spent', icon: '💰' },
  { key: 'totalDiscountUsed', label: 'Total Discount Used', icon: '🎁' },
  { key: 'mostBookedService', label: 'Most Booked Service', icon: '⭐' },
  { key: 'bookings', label: 'All Bookings History', icon: '📚' },
  { key: 'monthlyBookings', label: 'Monthly Booking Trend', icon: '📊' },
  { key: 'serviceHistory', label: 'Service History', icon: '🏢' },
];

const CustomerReportPage = () => {
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
      
      // Smart auto-addition of related fields for comprehensive reports
      let fieldsToRequest = [...selectedFields];
      
      // Rule 1: Total Bookings → Auto-add breakdown + detailed history
      if (selectedFields.includes('totalBookings')) {
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📋 Auto-adding: All Bookings History (detailed table)');
        }
        if (!selectedFields.includes('completedBookings')) {
          fieldsToRequest.push('completedBookings');
          console.log('✅ Auto-adding: Completed Bookings (breakdown)');
        }
        if (!selectedFields.includes('cancelledBookings')) {
          fieldsToRequest.push('cancelledBookings');
          console.log('❌ Auto-adding: Cancelled Bookings (breakdown)');
        }
      }
      
      // Rule 2: Completed/Cancelled Bookings → Auto-add total + detailed history
      if (selectedFields.includes('completedBookings') || selectedFields.includes('cancelledBookings')) {
        if (!selectedFields.includes('totalBookings')) {
          fieldsToRequest.push('totalBookings');
          console.log('📊 Auto-adding: Total Bookings (overview)');
        }
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (detailed table)');
        }
      }
      
      // Rule 3: Total Spent → Auto-add discount + detailed history
      if (selectedFields.includes('totalSpent')) {
        if (!selectedFields.includes('totalDiscountUsed')) {
          fieldsToRequest.push('totalDiscountUsed');
          console.log('🎁 Auto-adding: Total Discount Used (savings)');
        }
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (price details)');
        }
      }
      
      // Rule 4: Discount Used → Auto-add spent + detailed history
      if (selectedFields.includes('totalDiscountUsed')) {
        if (!selectedFields.includes('totalSpent')) {
          fieldsToRequest.push('totalSpent');
          console.log('💰 Auto-adding: Total Spent (context)');
        }
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (discount details)');
        }
      }
      
      // Rule 5: Most Booked Service → Auto-add detailed history
      if (selectedFields.includes('mostBookedService')) {
        if (!selectedFields.includes('serviceHistory')) {
          fieldsToRequest.push('serviceHistory');
          console.log('🏢 Auto-adding: Service History (service analysis)');
        }
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (service context)');
        }
      }
      
      // Rule 6: Monthly Trend → Auto-add detailed history
      if (selectedFields.includes('monthlyBookings')) {
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (monthly details)');
        }
      }
      
      // Rule 7: Service History → Auto-add most booked + detailed history
      if (selectedFields.includes('serviceHistory')) {
        if (!selectedFields.includes('mostBookedService')) {
          fieldsToRequest.push('mostBookedService');
          console.log('⭐ Auto-adding: Most Booked Service (top service)');
        }
        if (!selectedFields.includes('bookings')) {
          fieldsToRequest.push('bookings');
          console.log('📚 Auto-adding: All Bookings History (service data)');
        }
      }
      
      // Remove duplicates
      fieldsToRequest = [...new Set(fieldsToRequest)];
      
      console.log('🚀 Generating COMPREHENSIVE report with fields:', fieldsToRequest);
      console.log('Originally selected:', selectedFields);
      console.log('Auto-added fields:', fieldsToRequest.filter(f => !selectedFields.includes(f)));
      
      const response = await fetch('/api/reports/customer/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedFields: fieldsToRequest }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report data received:', Object.keys(result.data));
        setReportData(result.data);
        message.success('Comprehensive report generated successfully!');
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        message.error(errorData.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
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
      
      const response = await fetch('/api/reports/customer/pdf', {
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
        link.download = `custom_customer_report_${Date.now()}.pdf`;
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
      
      const response = await fetch('/api/reports/customer/excel', {
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
        link.download = `custom_customer_report_${Date.now()}.xlsx`;
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
    if (!reportData || Object.keys(reportData).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <BarChartOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <div>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Select report fields and click "Generate Report" to view your booking analytics
            </Text>
          </div>
        </div>
      );
    }

    console.log('Rendering report with data:', reportData);

    return (
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Overview Statistics - Display if data exists */}
        <Row gutter={[16, 16]}>
          {reportData.totalBookings !== undefined && reportData.totalBookings !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Bookings', reportData.totalBookings, '📋')}
            </Col>
          )}
          {reportData.completedBookings !== undefined && reportData.completedBookings !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Completed Bookings', reportData.completedBookings, '✅')}
            </Col>
          )}
          {reportData.cancelledBookings !== undefined && reportData.cancelledBookings !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Cancelled Bookings', reportData.cancelledBookings, '❌')}
            </Col>
          )}
          {reportData.totalSpent !== undefined && reportData.totalSpent !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Spent', `₹${reportData.totalSpent.toFixed(2)}`, '💰')}
            </Col>
          )}
          {reportData.totalDiscountUsed !== undefined && reportData.totalDiscountUsed !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Total Discount Used', `₹${reportData.totalDiscountUsed.toFixed(2)}`, '🎁')}
            </Col>
          )}
          {reportData.mostBookedService !== undefined && reportData.mostBookedService !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              {renderStatCard('Most Booked Service', reportData.mostBookedService || 'N/A', '⭐')}
            </Col>
          )}
        </Row>

        {/* All Bookings History - Display if data exists and has items */}
        {reportData.bookings && Array.isArray(reportData.bookings) && reportData.bookings.length > 0 && (
          <Card title="📚 Complete Booking History - All Details">
            <Table
              dataSource={reportData.bookings}
              columns={[
                {
                  title: 'Service',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                  width: 150,
                },
                {
                  title: 'Therapist',
                  dataIndex: 'therapistName',
                  key: 'therapistName',
                  width: 120,
                },
                {
                  title: 'Appointment Date & Time',
                  key: 'appointmentDateTime',
                  render: (_: any, record: any) => {
                    const apptDate = record.appointmentDate ? new Date(record.appointmentDate) : new Date(record.date);
                    const dateStr = apptDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    });
                    const timeStr = record.time ? `at ${record.time}` : '';
                    return (
                      <div>
                        <div><Text strong>{dateStr}</Text></div>
                        {timeStr && <div><Text type="secondary">{timeStr}</Text></div>}
                      </div>
                    );
                  },
                  sorter: (a, b) => new Date(a.appointmentDate || a.date).getTime() - new Date(b.appointmentDate || b.date).getTime(),
                  width: 180,
                },
                {
                  title: 'Booked On',
                  key: 'createdAt',
                  render: (_: any, record: any) => {
                    const createdDate = new Date(record.createdAt);
                    return createdDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  },
                  sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                  width: 120,
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
                      <span style={{ 
                        color: colors[status?.toLowerCase()] || '#666',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: status?.toLowerCase() === 'completed' ? '#f6ffed' : 
                                        status?.toLowerCase() === 'cancelled' ? '#fff1f0' : 
                                        status?.toLowerCase() === 'confirmed' ? '#e6f7ff' : '#fffbe6'
                      }}>
                        {status?.toUpperCase()}
                      </span>
                    );
                  },
                  width: 100,
                },
                {
                  title: 'Payment',
                  key: 'payment',
                  render: (_: any, record: any) => (
                    <div>
                      <div><Text strong>₹{(record.finalPrice || 0).toFixed(2)}</Text></div>
                      {record.originalPrice && record.originalPrice !== record.finalPrice && (
                        <div><Text type="secondary" delete>₹{record.originalPrice.toFixed(2)}</Text></div>
                      )}
                      {record.paymentStatus && (
                        <div>
                          <Text code style={{ fontSize: '12px' }}>
                            {record.paymentStatus.toUpperCase()}
                          </Text>
                        </div>
                      )}
                    </div>
                  ),
                  sorter: (a, b) => a.finalPrice - b.finalPrice,
                  width: 120,
                },
                {
                  title: 'Discount',
                  key: 'discount',
                  render: (_: any, record: any) => (
                    <div>
                      {record.discountApplied ? (
                        <>
                          <div><Text style={{ color: '#52c41a' }}>✅ Yes</Text></div>
                          <div><Text type="secondary">₹{(record.discountAmount || 0).toFixed(2)}</Text></div>
                        </>
                      ) : (
                        <Text type="secondary">No</Text>
                      )}
                    </div>
                  ),
                  width: 100,
                },
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="_id"
              scroll={{ x: 1200 }}
              size="middle"
              summary={(pageData) => {
                const totalPrice = pageData.reduce((sum, booking) => sum + (booking.finalPrice || 0), 0);
                const totalOriginalPrice = pageData.reduce((sum, booking) => sum + (booking.originalPrice || booking.finalPrice || 0), 0);
                const totalDiscount = pageData.reduce((sum, booking) => sum + (booking.discountAmount || 0), 0);
                const completedCount = pageData.filter(b => b.status?.toLowerCase() === 'completed').length;
                const cancelledCount = pageData.filter(b => b.status?.toLowerCase() === 'cancelled').length;
                const pendingCount = pageData.filter(b => b.status?.toLowerCase() === 'pending').length;
                const confirmedCount = pageData.filter(b => b.status?.toLowerCase() === 'confirmed').length;
                const discountCount = pageData.filter(b => b.discountApplied).length;
                
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong style={{ fontSize: '14px' }}>📊 Summary</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>{pageData.length} total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong style={{ color: '#52c41a' }}>₹{totalPrice.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <Text strong>🎁 {discountCount}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text type="secondary">Status Breakdown:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text style={{ color: '#52c41a' }}>✓ {completedCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text style={{ color: '#1890ff' }}>◷ {confirmedCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <Text style={{ color: '#faad14' }}>⏳ {pendingCount}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6}>
                        <Text style={{ color: '#ff4d4f' }}>✗ {cancelledCount}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Monthly Booking Trend - Display if data exists and has items */}
        {reportData.monthlyBookings && Array.isArray(reportData.monthlyBookings) && reportData.monthlyBookings.length > 0 && (
          <Card title="📊 Monthly Booking Trend">
            <Table
              dataSource={reportData.monthlyBookings}
              columns={[
                {
                  title: 'Month',
                  dataIndex: 'month',
                  key: 'month',
                  render: (month: string) => new Date(month + '-01').toLocaleString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }),
                },
                {
                  title: 'Bookings',
                  dataIndex: 'bookings',
                  key: 'bookings',
                  sorter: (a, b) => a.bookings - b.bookings,
                },
                {
                  title: 'Total Spent',
                  dataIndex: 'spent',
                  key: 'spent',
                  render: (spent: number) => `₹${spent.toFixed(2)}`,
                  sorter: (a, b) => a.spent - b.spent,
                },
              ]}
              pagination={false}
              rowKey="month"
              summary={(pageData) => {
                const totalBookings = pageData.reduce((sum, item) => sum + item.bookings, 0);
                const totalSpent = pageData.reduce((sum, item) => sum + item.spent, 0);
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
                        <Text strong style={{ color: '#52c41a' }}>₹{totalSpent.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        )}

        {/* Service History - Display if data exists and has items */}
        {reportData.serviceHistory && Array.isArray(reportData.serviceHistory) && reportData.serviceHistory.length > 0 && (
          <Card title="🏢 Service History">
            <Table
              dataSource={reportData.serviceHistory}
              columns={[
                {
                  title: 'Service Name',
                  dataIndex: 'serviceName',
                  key: 'serviceName',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Times Booked',
                  dataIndex: 'bookings',
                  key: 'bookings',
                  sorter: (a, b) => a.bookings - b.bookings,
                },
                {
                  title: 'Total Spent',
                  dataIndex: 'totalSpent',
                  key: 'totalSpent',
                  render: (spent: number) => `₹${spent.toFixed(2)}`,
                  sorter: (a, b) => a.totalSpent - b.totalSpent,
                },
                {
                  title: 'Last Booking',
                  dataIndex: 'lastBooking',
                  key: 'lastBooking',
                  render: (date: string) => new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
                },
              ]}
              pagination={false}
              rowKey="serviceName"
              summary={(pageData) => {
                const totalBookings = pageData.reduce((sum, item) => sum + item.bookings, 0);
                const totalSpent = pageData.reduce((sum, item) => sum + item.totalSpent, 0);
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
                        <Text strong style={{ color: '#52c41a' }}>₹{totalSpent.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} />
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
              My Booking Reports
            </Title>
            <Text type="secondary">
              Generate customized reports for your booking history and spending
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

export default CustomerReportPage;
