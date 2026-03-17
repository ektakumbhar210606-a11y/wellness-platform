'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic, Table, Button, Spin, Alert, Tabs } from 'antd';
import { 
  DownloadOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  GiftOutlined
} from '@ant-design/icons';

interface ReportPageProps {
  role: 'customer' | 'business' | 'therapist';
}

interface CustomerReportData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  totalDiscountUsed: number;
  mostBookedService: string;
  recentBookings: any[];
}

interface BusinessReportData {
  totalServices: number;
  totalTherapists: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  mostBookedService: string;
  topTherapist: {
    id: string;
    name: string;
    bookings: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
}

interface TherapistReportData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  totalServicesDone: number;
  monthlyCancelCount: number;
  bonusPenaltyPercentage: number;
  recentBookings: any[];
}

const ReportPage: React.FC<ReportPageProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [role]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const endpoint = `/api/reports/${role}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      // Pass token as query parameter since window.open doesn't support headers
      window.open(`/api/reports/download/${role}/pdf?token=${token}`, '_blank');
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      // Pass token as query parameter since window.open doesn't support headers
      window.open(`/api/reports/download/${role}/excel?token=${token}`, '_blank');
    } catch (err) {
      console.error('Error downloading Excel:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        title="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  // Render based on role
  if (role === 'customer') {
    return <CustomerReportView data={reportData as CustomerReportData} onDownloadPDF={handleDownloadPDF} onDownloadExcel={handleDownloadExcel} />;
  } else if (role === 'business') {
    return <BusinessReportView data={reportData as BusinessReportData} onDownloadPDF={handleDownloadPDF} onDownloadExcel={handleDownloadExcel} />;
  } else if (role === 'therapist') {
    return <TherapistReportView data={reportData as TherapistReportData} onDownloadPDF={handleDownloadPDF} onDownloadExcel={handleDownloadExcel} />;
  }

  return null;
};

// Customer Report View
const CustomerReportView: React.FC<{ 
  data: CustomerReportData; 
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}> = ({ data, onDownloadPDF, onDownloadExcel }) => {
  const recentBookingsColumns = [
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName'
    },
    {
      title: 'Therapist',
      dataIndex: 'therapistName',
      key: 'therapistName'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Price',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      render: (price: number) => `₹${price.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'orange' }}>
          {status}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Booking Report</h1>
        <div>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={onDownloadPDF}
            style={{ marginRight: '10px' }}
          >
            Download PDF
          </Button>
          <Button 
            type="primary" 
            icon={<FileExcelOutlined />} 
            onClick={onDownloadExcel}
          >
            Download Excel
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={data.totalBookings}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Completed"
              value={data.completedBookings}
              styles={{ content: { color: '#3f8600' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Cancelled"
              value={data.cancelledBookings}
              styles={{ content: { color: '#cf1322' } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Spent"
              value={data.totalSpent}
              precision={2}
              prefix={<DollarCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
              suffix="₹"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Discount Used"
              value={data.totalDiscountUsed}
              precision={2}
              prefix={<GiftOutlined />}
              styles={{ content: { color: '#722ed1' } }}
              suffix="₹"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Most Booked Service"
              value={data.mostBookedService || 'N/A'}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: '24px' }}>
        <Card title="Recent Bookings">
          <Table
            columns={recentBookingsColumns}
            dataSource={data.recentBookings}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    </div>
  );
};

// Business Report View
const BusinessReportView: React.FC<{ 
  data: BusinessReportData; 
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}> = ({ data, onDownloadPDF, onDownloadExcel }) => {
  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Business Performance Report</h1>
        <div>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={onDownloadPDF}
            style={{ marginRight: '10px' }}
          >
            Download PDF
          </Button>
          <Button 
            type="primary" 
            icon={<FileExcelOutlined />} 
            onClick={onDownloadExcel}
          >
            Download Excel
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Services"
              value={data.totalServices}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Therapists"
              value={data.totalTherapists}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={data.totalBookings}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={data.completedBookings}
              styles={{ content: { color: '#3f8600' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={data.cancelledBookings}
              styles={{ content: { color: '#cf1322' } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={data.totalRevenue}
              precision={2}
              prefix={<DollarCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
              suffix="₹"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Most Booked Service"
              value={data.mostBookedService || 'N/A'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Top Therapist"
              value={data.topTherapist?.name || 'N/A'}
              suffix={`(${data.topTherapist?.bookings || 0} bookings)`}
            />
          </Card>
        </Col>
      </Row>

      {data.monthlyRevenue && data.monthlyRevenue.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Card title="Monthly Revenue Trend">
            <Table
              columns={[
                {
                  title: 'Month',
                  dataIndex: 'month',
                  key: 'month',
                  render: (month: string) => new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (revenue: number) => `₹${revenue.toFixed(2)}`
                }
              ]}
              dataSource={data.monthlyRevenue.slice(0, 12)}
              rowKey="month"
              pagination={false}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

// Therapist Report View
const TherapistReportView: React.FC<{ 
  data: TherapistReportData; 
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}> = ({ data, onDownloadPDF, onDownloadExcel }) => {
  const recentBookingsColumns = [
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'serviceName'
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (earnings: number) => `₹${earnings.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'orange' }}>
          {status}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Performance Report</h1>
        <div>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={onDownloadPDF}
            style={{ marginRight: '10px' }}
          >
            Download PDF
          </Button>
          <Button 
            type="primary" 
            icon={<FileExcelOutlined />} 
            onClick={onDownloadExcel}
          >
            Download Excel
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={data.totalBookings}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Completed"
              value={data.completedBookings}
              styles={{ content: { color: '#3f8600' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Cancelled"
              value={data.cancelledBookings}
              styles={{ content: { color: '#cf1322' } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Earnings"
              value={data.totalEarnings}
              precision={2}
              prefix={<DollarCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
              suffix="₹"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Services Performed"
              value={data.totalServicesDone}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Monthly Cancellations"
              value={data.monthlyCancelCount}
              styles={{ content: { color: data.monthlyCancelCount > 0 ? '#cf1322' : '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Bonus/Penalty"
              value={`${data.bonusPenaltyPercentage >= 0 ? '+' : ''}${data.bonusPenaltyPercentage}%`}
              styles={{ content: { color: data.bonusPenaltyPercentage >= 0 ? '#3f8600' : '#cf1322' } }}
              prefix={<GiftOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {data.recentBookings && data.recentBookings.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Card title="Recent Bookings">
            <Table
              columns={recentBookingsColumns}
              dataSource={data.recentBookings}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
