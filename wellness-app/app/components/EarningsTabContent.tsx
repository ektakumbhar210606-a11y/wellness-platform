'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, Card, Spin, Typography, Empty, Row, Col, Statistic, Tag } from 'antd';
import { CreditCardOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/currencyFormatter';


const { Title, Text } = Typography;

interface Booking {
  id: string;
  displayId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  therapist: {
    id: string;
    fullName: string;
    professionalTitle: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  date: string;
  time: string;
  status: string;
  paymentStatus?: string;
  advancePaid?: number;
  remainingAmount?: number;
  totalAmount?: number;
}

interface EarningsTabContentProps {
  bookings: Booking[];
  loading: boolean;
}

const EarningsTabContent: React.FC<EarningsTabContentProps> = ({ bookings, loading }) => {
  const [activeTab, setActiveTab] = useState('half-payment');

  // Filter bookings for half payment (PARTIAL payment status or has advancePaid with remainingAmount > 0)
  const halfPaymentBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Check if paymentStatus is PARTIAL
      if (booking.paymentStatus === 'partial') {
        return true;
      }
      // Check if advancePaid exists and remainingAmount > 0
      if (booking.advancePaid !== undefined && booking.remainingAmount !== undefined && booking.remainingAmount > 0) {
        return true;
      }
      return false;
    }).filter(booking => booking && booking.id); // Additional filter to ensure booking objects are valid
  }, [bookings]);

  // Filter bookings for full payment (PAID payment status or remainingAmount === 0)
  const fullPaymentBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Check if paymentStatus is PAID or COMPLETED
      if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') {
        return true;
      }
      // Check if remainingAmount is 0 or undefined (meaning fully paid)
      if (booking.remainingAmount === 0 || booking.remainingAmount === undefined) {
        return true;
      }
      return false;
    }).filter(booking => booking && booking.id); // Additional filter to ensure booking objects are valid
  }, [bookings]);

  // Calculate earnings summary
  const earningsSummary = useMemo(() => {
    const halfPaymentTotal = halfPaymentBookings.reduce((sum, booking) => {
      const advancePaid = booking.advancePaid !== undefined ? booking.advancePaid : 0;
      return sum + advancePaid;
    }, 0);

    const fullPaymentTotal = fullPaymentBookings.reduce((sum, booking) => {
      const totalAmount = booking.totalAmount || (booking.service?.price || 0);
      return sum + totalAmount;
    }, 0);

    return {
      halfPaymentCount: halfPaymentBookings.length,
      halfPaymentTotal,
      fullPaymentCount: fullPaymentBookings.length,
      fullPaymentTotal,
      totalEarnings: halfPaymentTotal + fullPaymentTotal
    };
  }, [halfPaymentBookings, fullPaymentBookings]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading earnings data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>Earnings Overview</Title>
      <Text type="secondary">
        Track your business earnings from partial and full payments
      </Text>

      {/* Earnings Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Half Payment Bookings"
              value={earningsSummary.halfPaymentCount}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Half Payment Revenue"
              value={earningsSummary.halfPaymentTotal}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Full Payment Bookings"
              value={earningsSummary.fullPaymentCount}
              prefix={<MoneyCollectOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Full Payment Revenue"
              value={earningsSummary.fullPaymentTotal}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Statistic
          title="Total Earnings"
          value={earningsSummary.totalEarnings}
          precision={2}

          valueStyle={{ fontSize: 24, color: '#1890ff' }}
        />
      </Card>

      {/* Payment Tabs */}
      <div style={{ marginTop: 32 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'half-payment',
              label: (
                <span>
                  <CreditCardOutlined />
                  Half Payment ({halfPaymentBookings.length})
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {halfPaymentBookings.length > 0 ? (
                    <Row gutter={[16, 16]}>
                      {halfPaymentBookings.map((booking) => (
                        <Col key={booking.id} xs={24} sm={12} md={8} lg={6}>
                          <Card 
                            title={
                              <div>
                                <Text strong>{booking.service?.name || 'Service'}</Text>
                                <br />
                                <Text type="secondary">{booking.customer?.firstName || ''} {booking.customer?.lastName || ''}</Text>
                              </div>
                            }
                            extra={
                              <Tag color="orange">
                                Half Payment
                                <br />
                                Paid: {formatCurrency(booking.advancePaid || 0, 'default')}
                                <br />
                                Remaining: {formatCurrency(booking.remainingAmount || 0, 'default')}
                              </Tag>
                            }
                            style={{ height: '100%' }}
                          >
                            <div>
                              <Text strong>Date:</Text> {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                              <br />
                              <Text strong>Time:</Text> {booking.time || 'N/A'}
                              <br />
                              <Text strong>Booking ID:</Text> {booking.displayId || booking.id || 'N/A'}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Empty
                      description="No half payment bookings found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Text type="secondary">
                        Bookings with partial payments will appear here
                      </Text>
                    </Empty>
                  )}
                </div>
              ),
            },
            {
              key: 'full-payment',
              label: (
                <span>
                  <MoneyCollectOutlined />
                  Full Payment ({fullPaymentBookings.length})
                </span>
              ),
              children: (
                <div style={{ marginTop: 16 }}>
                  {fullPaymentBookings.length > 0 ? (
                    <Row gutter={[16, 16]}>
                      {fullPaymentBookings.map((booking) => (
                        <Col key={booking.id} xs={24} sm={12} md={8} lg={6}>
                          <Card 
                            title={
                              <div>
                                <Text strong>{booking.service?.name || 'Service'}</Text>
                                <br />
                                <Text type="secondary">{booking.customer?.firstName || ''} {booking.customer?.lastName || ''}</Text>
                              </div>
                            }
                            extra={
                              <Tag color="green">
                                Full Payment
                                <br />
                                Total: {formatCurrency(booking.totalAmount || booking.service?.price || 0, 'default')}
                              </Tag>
                            }
                            style={{ height: '100%' }}
                          >
                            <div>
                              <Text strong>Date:</Text> {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}
                              <br />
                              <Text strong>Time:</Text> {booking.time || 'N/A'}
                              <br />
                              <Text strong>Booking ID:</Text> {booking.displayId || booking.id || 'N/A'}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Empty
                      description="No full payment bookings found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Text type="secondary">
                        Fully paid bookings will appear here
                      </Text>
                    </Empty>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default EarningsTabContent;