'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tag, Table, Modal, message, Divider, Empty, Spin, Row, Col, Statistic } from 'antd';
import {
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ShopOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';
import { formatCurrency } from '../../../utils/currencyFormatter';

const { Title, Text } = Typography;

interface CancelRequest {
  id: string;
  displayId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  therapist: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  bookingDetails: {
    date: Date;
    time: string;
    originalDate?: Date;
    originalTime?: string;
  };
  cancelRequest: {
    reason: string;
    requestedAt: Date;
    reviewStatus: 'pending' | 'approved' | 'rejected';
  };
  paymentInfo: {
    amount: number;
    advancePaid: number;
    paymentStatus: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TherapistCancelRequests: React.FC = () => {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancelRequest | null>(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchCancelRequests = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/business/therapist-cancel-requests');
      
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        console.error('API Error:', response.error);
        message.error(response.error || 'Failed to fetch cancellation requests');
        setRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching cancellation requests:', error);
      message.error('Failed to fetch cancellation requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  const handleApprove = async (request: CancelRequest) => {
    setSelectedRequest(request);
    setApprovalModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(selectedRequest.id);
      const response = await makeAuthenticatedRequest(
        `/api/business/therapist-cancel-requests/${selectedRequest.id}/process`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'approve' })
        }
      );

      if (response.success) {
        message.success('Cancellation approved. 50% refund will be processed to customer.');
        setApprovalModalVisible(false);
        setSelectedRequest(null);
        fetchCancelRequests();
      } else {
        message.error(response.error || 'Failed to approve cancellation');
      }
    } catch (error: any) {
      console.error('Error approving cancellation:', error);
      message.error('Failed to approve cancellation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: CancelRequest) => {
    try {
      setActionLoading(request.id);
      const response = await makeAuthenticatedRequest(
        `/api/business/therapist-cancel-requests/${request.id}/process`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject' })
        }
      );

      if (response.success) {
        message.success('Cancellation request rejected. Booking remains confirmed.');
        fetchCancelRequests();
      } else {
        message.error(response.error || 'Failed to reject cancellation');
      }
    } catch (error: any) {
      console.error('Error rejecting cancellation:', error);
      message.error('Failed to reject cancellation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Review</Tag>;
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const filterRequests = (statusType: string) => {
    if (statusType === 'all') return requests;
    return requests.filter(r => r.cancelRequest.reviewStatus === statusType);
  };

  const filteredRequests = filterRequests(filterStatus);

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'displayId',
      key: 'displayId',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: CancelRequest) => (
        <div>
          <Text strong>{record.customer.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer.email}</Text>
        </div>
      ),
    },
    {
      title: 'Therapist',
      key: 'therapist',
      render: (_: any, record: CancelRequest) => (
        <div>
          <Text strong>{record.therapist.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.therapist.email}</Text>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_: any, record: CancelRequest) => (
        <div>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {dayjs(record.bookingDetails.date).format('MMM D, YYYY')} at {record.bookingDetails.time}
        </div>
      ),
    },
    {
      title: 'Cancel Reason',
      dataIndex: ['cancelRequest', 'reason'],
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Refund Amount',
      key: 'refundAmount',
      render: (_: any, record: CancelRequest) => (
        <Text strong style={{ color: '#d32f2f' }}>
          {formatCurrency(record.paymentInfo.advancePaid, 'INR')}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: ['cancelRequest', 'reviewStatus'],
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Requested At',
      dataIndex: ['cancelRequest', 'requestedAt'],
      key: 'requestedAt',
      render: (date: Date) => dayjs(date).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CancelRequest) => (
        <Space size="small">
          {record.cancelRequest.reviewStatus === 'pending' && (
            <>
              <Button
                type="primary"
                danger
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
                loading={actionLoading === record.id}
              >
                Approve & Refund
              </Button>
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
                loading={actionLoading === record.id}
                disabled={actionLoading !== null}
              >
                Reject
              </Button>
            </>
          )}
          {record.cancelRequest.reviewStatus !== 'pending' && (
            <Tag color={record.cancelRequest.reviewStatus === 'approved' ? 'green' : 'red'}>
              {record.cancelRequest.reviewStatus === 'approved' ? 'Approved' : 'Rejected'}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.cancelRequest.reviewStatus === 'pending').length,
    approved: requests.filter(r => r.cancelRequest.reviewStatus === 'approved').length,
    rejected: requests.filter(r => r.cancelRequest.reviewStatus === 'rejected').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Requests" 
              value={stats.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Pending Review" 
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Approved" 
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Rejected" 
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space>
            <StopOutlined style={{ color: '#d32f2f' }} />
            Therapist Cancellation Requests
          </Space>
        }
        extra={
          <Space>
            <Button onClick={fetchCancelRequests} loading={loading}>
              Refresh
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>Filter:</Text>
            <Button
              type={filterStatus === 'all' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              type={filterStatus === 'pending' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
            <Button
              type={filterStatus === 'approved' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterStatus('approved')}
            >
              Approved
            </Button>
            <Button
              type={filterStatus === 'rejected' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterStatus('rejected')}
            >
              Rejected
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Loading cancellation requests...</Text>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Empty
            description={filterStatus === 'pending' ? 'No pending cancellation requests' : 'No cancellation requests found'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={fetchCancelRequests}>
              Refresh
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRequests}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Approval Confirmation Modal */}
      <Modal
        title="Approve Cancellation & Refund"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button key="back" onClick={() => {
            setApprovalModalVisible(false);
            setSelectedRequest(null);
          }}>
            Back
          </Button>,
          <Button
            key="approve"
            type="primary"
            danger
            onClick={confirmApprove}
            loading={actionLoading === selectedRequest?.id}
          >
            Confirm Approval & Refund
          </Button>
        ]}
      >
        {selectedRequest && (
          <div>
            <Title level={5}>Booking Details</Title>
            <p><strong>Booking ID:</strong> {selectedRequest.displayId}</p>
            <p><strong>Customer:</strong> {selectedRequest.customer.name}</p>
            <p><strong>Therapist:</strong> {selectedRequest.therapist.name}</p>
            <p><strong>Service:</strong> {selectedRequest.service.name}</p>
            <p><strong>Date & Time:</strong> {dayjs(selectedRequest.bookingDetails.date).format('MMM D, YYYY')} at {selectedRequest.bookingDetails.time}</p>
            
            <Divider />
            
            <div style={{ backgroundColor: '#fff0f0', padding: 16, borderRadius: 8, border: '1px solid #ffa39e' }}>
              <Title level={5} style={{ color: '#d32f2f', marginTop: 0 }}>Cancellation Request</Title>
              <p><strong>Reason:</strong> {selectedRequest.cancelRequest.reason}</p>
              <p><strong>Requested At:</strong> {dayjs(selectedRequest.cancelRequest.requestedAt).format('MMM D, YYYY h:mm A')}</p>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <div style={{ marginBottom: 12 }}>
                <Text strong>Refund Details:</Text>
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  <li>Total Service Price: {formatCurrency(selectedRequest.paymentInfo.amount, 'INR')}</li>
                  <li>Advance Paid by Customer: {formatCurrency(selectedRequest.paymentInfo.advancePaid, 'INR')}</li>
                  <li style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    Refund Amount (50% Advance): {formatCurrency(selectedRequest.paymentInfo.advancePaid, 'INR')}
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ⚠️ By approving this cancellation, you agree to process a 50% refund of the advance payment to the customer. The booking will be cancelled and the slot will be released back to the therapist's availability.
              </Text>
            </div>

            <div style={{ marginTop: 16, fontWeight: 'bold', color: '#d32f2f' }}>
              Are you sure you want to approve this cancellation and refund?
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TherapistCancelRequests;
