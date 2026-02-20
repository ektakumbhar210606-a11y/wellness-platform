'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Spin, 
  message, 
  Tabs, 
  Typography,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Descriptions
} from 'antd';
import { 
  DollarOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/currencyFormatter';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Booking {
  id: string;
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
    currency: string;
  };
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  };
  date: string;
  time: string;
  duration: number;
  status: 'confirmed';
  paymentStatus: 'partial' | 'completed';
  therapistPayoutStatus: 'pending' | 'paid';
  notes?: string;
  createdAt: string;
}

interface EarningsData {
  totalAmount: number;
  currency: string;
  formattedTotal: string;
}

const BusinessEarningPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('half');
  const [halfPaymentBookings, setHalfPaymentBookings] = useState<Booking[]>([]);
  const [fullPaymentBookings, setFullPaymentBookings] = useState<Booking[]>([]);
  const [halfPaymentEarnings, setHalfPaymentEarnings] = useState<EarningsData | null>(null);
  const [fullPaymentEarnings, setFullPaymentEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch half payment bookings
  const fetchHalfPaymentBookings = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/earnings?type=half`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch half payment bookings');
      }
      
      setHalfPaymentBookings(result.data || []);
      setHalfPaymentEarnings({
        totalAmount: result.earnings.totalAmount,
        currency: result.earnings.currency,
        formattedTotal: result.earnings.formattedTotal
      });
    } catch (error: any) {
      console.error('Error fetching half payment bookings:', error);
      message.error(error.message || 'Failed to load half payment bookings');
      setHalfPaymentBookings([]);
      setHalfPaymentEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch full payment bookings
  const fetchFullPaymentBookings = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/earnings?type=full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch full payment bookings');
      }
      
      setFullPaymentBookings(result.data || []);
      setFullPaymentEarnings({
        totalAmount: result.earnings.totalAmount,
        currency: result.earnings.currency,
        formattedTotal: result.earnings.formattedTotal
      });
    } catch (error: any) {
      console.error('Error fetching full payment bookings:', error);
      message.error(error.message || 'Failed to load full payment bookings');
      setFullPaymentBookings([]);
      setFullPaymentEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  // Show booking details modal
  const showBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  // Handle paying to therapist
  const handlePayToTherapist = async (bookingId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/pay-therapist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process payment to therapist');
      }
      
      message.success('Payment to therapist processed successfully');
      
      // Refresh the full payment bookings to reflect the updated status
      if (activeTab === 'full') {
        fetchFullPaymentBookings();
      }
    } catch (error: any) {
      console.error('Error processing payment to therapist:', error);
      message.error(error.message || 'Failed to process payment to therapist');
    }
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'half') {
      fetchHalfPaymentBookings();
    } else if (key === 'full') {
      fetchFullPaymentBookings();
    }
  };

  // Initial data loading
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (user && user.role && user.role.toLowerCase() !== 'business') {
      router.push('/dashboard/provider');
      return;
    }
    
    // Load initial data based on active tab
    if (activeTab === 'half') {
      fetchHalfPaymentBookings();
    } else if (activeTab === 'full') {
      fetchFullPaymentBookings();
    }
  }, [isAuthenticated, user, router, activeTab]);

  // Auto-refresh data every 30 seconds when the tab is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (activeTab === 'full') {
      // Refresh full payment data every 30 seconds
      intervalId = setInterval(() => {
        fetchFullPaymentBookings();
      }, 30000);
    } else if (activeTab === 'half') {
      // Refresh half payment data every 30 seconds
      intervalId = setInterval(() => {
        fetchHalfPaymentBookings();
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab]);

  // Columns for bookings table
  const bookingColumns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'firstName'],
      key: 'customer',
      render: (_: any, record: Booking) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName ? `${record.customer.firstName} ${record.customer.lastName || ''}` : (record.customer.name || 'N/A')}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <MailOutlined /> {record.customer.email}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            <PhoneOutlined /> {record.customer.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.service.name}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.service.duration} mins • {formatCurrency(record.service.price, record.service.currency)}
          </div>
        </div>
      ),
    },
    {
      title: 'Therapist',
      dataIndex: ['therapist', 'fullName'],
      key: 'therapist',
      render: (_: any, record: Booking) => (
        <div>
          <div>{record.therapist.fullName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.therapist.professionalTitle}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: Booking) => (
        <div>
          <div><CalendarOutlined /> {new Date(record.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.time}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: Booking) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
          <DollarOutlined /> {formatCurrency(record.service.price, record.service.currency)}
        </div>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag 
          color={status === 'partial' ? 'orange' : 'green'}
          icon={status === 'partial' ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
        >
          {status === 'partial' ? 'Half Payment' : 'Full Payment'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <>
          <Button 
            type="link" 
            size="small"
            onClick={() => showBookingDetails(record)}
          >
            View Details
          </Button>
          {activeTab === 'full' && (
            <Button 
              type="primary"
              size="small"
              disabled={record.therapistPayoutStatus === 'paid'}
              onClick={() => handlePayToTherapist(record.id)}
            >
              {record.therapistPayoutStatus === 'paid' ? 'Paid to Therapist' : 'Pay to Therapist'}
            </Button>
          )}
        </>
      ),
    },
  ];

  if (loading && (!halfPaymentBookings.length && !fullPaymentBookings.length)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Business Earnings</Title>
          <Text type="secondary">
            Track your earnings from half and full payments
          </Text>
        </div>
        <Button 
          onClick={() => {
            if (activeTab === 'half') {
              fetchHalfPaymentBookings();
            } else {
              fetchFullPaymentBookings();
            }
          }}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Half Payment Earnings"
              value={halfPaymentEarnings?.totalAmount || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={halfPaymentEarnings?.currency || 'INR'}
              styles={{ content: { color: '#fa8c16' } }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
              {halfPaymentBookings.length} bookings
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Full Payment Earnings"
              value={fullPaymentEarnings?.totalAmount || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={fullPaymentEarnings?.currency || 'INR'}
              styles={{ content: { color: '#52c41a' } }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
              {fullPaymentBookings.length} bookings
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'half',
            label: (
              <span>
                <ClockCircleOutlined />
                Half Payment ({halfPaymentBookings.length})
              </span>
            ),
            children: (
              <Card style={{ marginTop: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading half payment bookings...</Text>
                    </div>
                  </div>
                ) : halfPaymentBookings.length > 0 ? (
                  <Table
                    dataSource={halfPaymentBookings}
                    columns={bookingColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} bookings`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <ClockCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>No Half Payment Bookings</Title>
                    <Text type="secondary">
                      You don't have any bookings with half payments at the moment.
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'full',
            label: (
              <span>
                <CheckCircleOutlined />
                Full Payment ({fullPaymentBookings.length})
              </span>
            ),
            children: (
              <Card style={{ marginTop: 16 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text>Loading full payment bookings...</Text>
                    </div>
                  </div>
                ) : fullPaymentBookings.length > 0 ? (
                  <Table
                    dataSource={fullPaymentBookings}
                    columns={bookingColumns}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} bookings`
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                    <Title level={4}>No Full Payment Bookings</Title>
                    <Text type="secondary">
                      You don't have any bookings with full payments yet.
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedBooking && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Customer Name">
              {selectedBooking.customer.firstName 
                ? `${selectedBooking.customer.firstName} ${selectedBooking.customer.lastName || ''}`
                : (selectedBooking.customer.name || 'N/A')}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Email">
              {selectedBooking.customer.email}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Phone">
              {selectedBooking.customer.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Service">
              {selectedBooking.service.name}
            </Descriptions.Item>
            <Descriptions.Item label="Service Price">
              {formatCurrency(selectedBooking.service.price, selectedBooking.service.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Service Duration">
              {selectedBooking.service.duration} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Therapist">
              {selectedBooking.therapist.fullName} ({selectedBooking.therapist.professionalTitle})
            </Descriptions.Item>
            <Descriptions.Item label="Booking Date">
              {new Date(selectedBooking.date).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Booking Time">
              {selectedBooking.time}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag 
                color={selectedBooking.paymentStatus === 'partial' ? 'orange' : 'green'}
                icon={selectedBooking.paymentStatus === 'partial' ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
              >
                {selectedBooking.paymentStatus === 'partial' ? 'Half Payment' : 'Full Payment'}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.notes && (
              <Descriptions.Item label="Notes">
                {selectedBooking.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BusinessEarningPage;