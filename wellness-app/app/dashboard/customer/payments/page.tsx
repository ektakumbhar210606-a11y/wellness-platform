'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Pagination,
  Empty,
  Spin,
  Alert,
  Modal,
  Descriptions,
  Divider,
  Select,
  Statistic,
  Tooltip
} from 'antd';
import { 
  WalletOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatTimeTo12Hour } from '@/app/utils/timeUtils';

const { Title, Text } = Typography;
const { Option } = Select;

// Interfaces
interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Therapist {
  id: string;
  fullName: string;
  professionalTitle?: string;
}

interface Business {
  id: string;
  name: string;
  currency?: string;
  address?: any;
}

interface Booking {
  id: string;
  service: Service | null;
  therapist: Therapist | null;
  business: Business | null;
  date: string;
  time: string;
  status: string;
  finalPrice?: number;
  originalPrice?: number;
  rewardDiscountApplied?: boolean;
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  totalAmount: number;
  servicePriceFromDB?: number; // Service price from database (authoritative source)
  advancePaid: number;
  remainingAmount: number;
  paymentType: 'FULL' | 'ADVANCE';
  method: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  booking: Booking | null;
}

interface PaymentResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const CustomerPaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch payments on component mount or when pagination/filter changes
  useEffect(() => {
    fetchPayments();
  }, [pagination.page, pagination.limit, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      console.log('Fetching payments with token:', token ? 'present' : 'missing');
      console.log('Query params:', queryParams.toString());

      const response = await fetch(`/api/customer/payments?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch payment history`);
      }

      const result: PaymentResponse = await response.json();
      console.log('Payment data received:', result);
      
      if (result.success) {
        setPayments(result.data.payments);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages
        }));
      } else {
        setError('Failed to load payment history');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalVisible(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'default';
      default:
        return 'blue';
    }
  };

  const getPaymentTypeTag = (type: 'FULL' | 'ADVANCE') => {
    return type === 'FULL' ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Final Payment</Tag>
    ) : (
      <Tag color="blue" icon={<ClockCircleOutlined />}>Advance Payment</Tag>
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return '💳';
      case 'debit_card':
        return '💳';
      case 'cash':
        return '💵';
      case 'paypal':
        return '🅿️';
      case 'bank_transfer':
        return '🏦';
      case 'mobile_wallet':
        return '📱';
      default:
        return '💰';
    }
  };

  // Table columns definition
  const columns: ColumnsType<Payment> = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.slice(-8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'Service',
      key: 'service',
      width: 200,
      render: (_: any, record: Payment) => (
        <div>
          <Text strong>{record.booking?.service?.name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.booking?.therapist?.fullName || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Booking Date',
      key: 'bookingDate',
      width: 150,
      render: (_: any, record: Payment) => (
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: '4px' }} />
            {record.booking?.date ? new Date(record.booking.date).toLocaleDateString() : 'N/A'}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ClockCircleOutlined style={{ marginRight: '4px' }} />
            {record.booking?.time ? formatTimeTo12Hour(record.booking.time) : 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 150,
      render: (date: string) => (
        <Text>
          {new Date(date).toLocaleDateString()}
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Text>
      ),
    },
    {
      title: 'Payment Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 120,
      render: (type: 'FULL' | 'ADVANCE') => getPaymentTypeTag(type),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method: string) => (
        <Space>
          <span>{getMethodIcon(method)}</span>
          <Text>{method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 130,
      render: (_: any, record: Payment) => {
        const currency = record.booking?.business?.currency || 'default';
        return (
          <Text strong>
            {formatCurrency(record.amount, currency)}
          </Text>
        );
      },
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      width: 130,
      render: (_: any, record: Payment) => {
        const currency = record.booking?.business?.currency || 'default';
        return (
          <Text type="secondary">
            {formatCurrency(record.totalAmount, currency)}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={
          status === 'completed' ? <CheckCircleOutlined /> :
          status === 'pending' ? <ClockCircleOutlined /> :
          status === 'failed' ? <CloseCircleOutlined /> : null
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: Payment) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleShowDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <WalletOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <Title level={2} style={{ margin: 0 }}>Payment History</Title>
          </Space>
          <Text type="secondary">
            View all your payment records and transaction history
          </Text>
        </Space>
      </Card>

      {/* Summary Cards */}
      <Space orientation="horizontal" size="middle" style={{ width: '100%', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Card style={{ minWidth: '200px', flex: 1 }} size="small">
          <Statistic
            title="Total Payments"
            value={pagination.total}
            prefix={<WalletOutlined />}
            styles={{ content: { color: '#667eea' } }}
          />
        </Card>
        <Card style={{ minWidth: '200px', flex: 1 }} size="small">
          <Statistic
            title="Completed"
            value={payments.filter(p => p.status === 'completed').length}
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: '#52c41a' } }}
          />
        </Card>
        <Card style={{ minWidth: '200px', flex: 1 }} size="small">
          <Statistic
            title="Pending"
            value={payments.filter(p => p.status === 'pending').length}
            prefix={<ClockCircleOutlined />}
            styles={{ content: { color: '#faad14' } }}
          />
        </Card>
      </Space>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <FilterOutlined />
          <Text strong>Filter:</Text>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' }
            ]}
          />
        </Space>
      </Card>

      {/* Payment Table */}
      <Card>
        {error && (
          <Alert
            title="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Loading payment history...</Text>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <Empty
            description="No payment records found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              When you make payments for bookings, they will appear here
            </Text>
          </Empty>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1400 }}
              size="middle"
            />

            <Divider />

            <Pagination
              current={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onChange={(page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  page,
                  limit: pageSize || prev.limit
                }));
              }}
              showSizeChanger
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} payments`}
              style={{ textAlign: 'right', marginTop: '16px' }}
            />
          </>
        )}
      </Card>

      {/* Payment Details Modal */}
      <Modal
        title={
          <Space>
            <WalletOutlined />
            <span>Payment Details</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedPayment && (
          <div>
            {/* Payment Information Section */}
            <Title level={5}>Payment Information</Title>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Payment ID">
                <Text code>{selectedPayment.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Date">
                {new Date(selectedPayment.paymentDate).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Type">
                {getPaymentTypeTag(selectedPayment.paymentType)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedPayment.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedPayment.status)}>
                  {selectedPayment.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(selectedPayment.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Financial Details Section */}
            <Title level={5}>Financial Details</Title>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Payment Amount">
                <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                  {formatCurrency(
                    selectedPayment.amount, 
                    selectedPayment.booking?.business?.currency || 'default'
                  )}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Service Amount">
                <Tooltip title={selectedPayment.servicePriceFromDB ? `Service price from database: ₹${selectedPayment.servicePriceFromDB}` : 'Price from booking record'}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatCurrency(
                      selectedPayment.totalAmount, 
                      selectedPayment.booking?.business?.currency || 'default'
                    )}
                  </Text>
                </Tooltip>
              </Descriptions.Item>
              
              {/* Show advance and remaining for all payments */}
              <Descriptions.Item label="Advance Paid">
                <Text strong>
                  {formatCurrency(
                    selectedPayment.advancePaid, 
                    selectedPayment.booking?.business?.currency || 'default'
                  )}
                </Text>
              </Descriptions.Item>
              
              {selectedPayment.paymentType === 'ADVANCE' ? (
                <>
                  <Descriptions.Item label="Remaining After This Payment">
                    <Text type="danger">
                      {formatCurrency(
                        selectedPayment.remainingAmount, 
                        selectedPayment.booking?.business?.currency || 'default'
                      )}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Stage">
                    <Tag color="blue">1st of 2</Tag>
                  </Descriptions.Item>
                </>
              ) : selectedPayment.paymentType === 'FULL' ? (
                <>
                  <Descriptions.Item label="Balance Paid">
                    <Text strong style={{ color: '#52c41a' }}>
                      {formatCurrency(
                        selectedPayment.amount, 
                        selectedPayment.booking?.business?.currency || 'default'
                      )}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Stage">
                    <Tag color="green">2nd of 2</Tag>
                  </Descriptions.Item>
                </>
              ) : null}
              
              {selectedPayment.booking?.rewardDiscountApplied && (
                <>
                  <Descriptions.Item label="Original Price">
                    <Text delete>
                      {formatCurrency(
                        selectedPayment.booking.originalPrice || 0, 
                        selectedPayment.booking?.business?.currency || 'default'
                      )}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Final Price (with discount)">
                    <Text strong style={{ color: '#52c41a' }}>
                      {formatCurrency(
                        selectedPayment.booking.finalPrice || 0, 
                        selectedPayment.booking?.business?.currency || 'default'
                      )}
                    </Text>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
            
            {/* Complete Payment Summary for All Payments */}
            <>
              <Divider />
              <div style={{ 
                background: selectedPayment.paymentType === 'FULL' ? '#f0f9ff' : '#fff7e6', 
                padding: '16px', 
                borderRadius: '8px',
                border: `1px solid ${selectedPayment.paymentType === 'FULL' ? '#bae7ff' : '#ffd591'}`
              }}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <Title level={5} style={{ margin: 0 }}>Payment Breakdown</Title>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Total Service Cost:</Text>
                    <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                      {formatCurrency(
                        selectedPayment.totalAmount, 
                        selectedPayment.booking?.business?.currency || 'default'
                      )}
                    </Text>
                  </div>
                  
                  {selectedPayment.paymentType === 'ADVANCE' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Advance Payment (Paid Online):</Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          {formatCurrency(
                            selectedPayment.advancePaid, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Remaining to Pay:</Text>
                        <Text strong style={{ color: '#ff4d4f' }}>
                          {formatCurrency(
                            selectedPayment.remainingAmount, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>Paid So Far:</Text>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                          {formatCurrency(
                            selectedPayment.advancePaid, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <Tag color="blue" icon={<ClockCircleOutlined />}>Partially Paid</Tag>
                      </div>
                    </>
                  )}
                  
                  {selectedPayment.paymentType === 'FULL' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Less: Advance Payment (Online):</Text>
                        <Text>
                          -{formatCurrency(
                            selectedPayment.advancePaid, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Plus: Final Payment (at venue):</Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          {formatCurrency(
                            selectedPayment.amount, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>Total Paid:</Text>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                          {formatCurrency(
                            selectedPayment.totalAmount, 
                            selectedPayment.booking?.business?.currency || 'default'
                          )}
                        </Text>
                      </div>
                      <div style={{ marginTop: '8px', textAlign: 'center' }}>
                        <Tag color="green" icon={<CheckCircleOutlined />}>Fully Paid</Tag>
                      </div>
                    </>
                  )}
                </Space>
              </div>
            </>

            <Divider />

            {/* Booking Details Section */}
            <Title level={5}>Booking Details</Title>
            {selectedPayment.booking ? (
              <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Service Name" span={{ xs: 2, sm: 2 }}>
                  {selectedPayment.booking.service?.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Service Price (from DB)">
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatCurrency(
                      selectedPayment.booking.service?.price || 0, 
                      selectedPayment.booking?.business?.currency || 'default'
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Service Duration">
                  {selectedPayment.booking.service?.duration || 60} minutes
                </Descriptions.Item>
                <Descriptions.Item label="Therapist" span={{ xs: 2, sm: 2 }}>
                  {selectedPayment.booking.therapist?.fullName || 'N/A'}
                  {selectedPayment.booking.therapist?.professionalTitle && (
                    <Text type="secondary">
                      {selectedPayment.booking.therapist.professionalTitle}
                    </Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Business">
                  {selectedPayment.booking.business?.name || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Booking Date & Time">
                  {selectedPayment.booking.date ? new Date(selectedPayment.booking.date).toLocaleDateString() : 'N/A'}
                  <br />
                  {selectedPayment.booking.time ? formatTimeTo12Hour(selectedPayment.booking.time) : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Booking Status">
                  <Tag>{selectedPayment.booking.status}</Tag>
                </Descriptions.Item>
                {selectedPayment.booking.service?.description && (
                  <Descriptions.Item label="Service Description" span={{ xs: 2, sm: 2 }}>
                    {selectedPayment.booking.service.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Empty description="No booking details available" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerPaymentsPage;
