'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Spin, 
  message, 
  Button, 
  Space, 
  Modal,
  Descriptions,
  DatePicker,
  TimePicker,
  Form,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SyncOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MailOutlined,
  PhoneOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { makeAuthenticatedRequest } from '@/app/utils/apiUtils';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/currencyFormatter';

const { RangePicker } = DatePicker;

interface TherapistResponse {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string;
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
  status: 'therapist_confirmed' | 'therapist_rejected' | string;
  paymentStatus?: 'pending' | 'partial' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  therapistResponded: boolean;
  responseVisibleToBusinessOnly: boolean;
  originalDate?: string;
  originalTime?: string;
  rescheduledBy?: string;
  rescheduledAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  assignedByAdmin: boolean;
  assignedById: string;
}

const TherapistResponseManager: React.FC = () => {
  const [responses, setResponses] = useState<TherapistResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<TherapistResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch therapist responses
  const fetchTherapistResponses = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/business/booking-responses');
      
      if (response.success && response.data) {
        setResponses(response.data);
      } else {
        message.error(response.error || 'Failed to fetch therapist responses');
        setResponses([]);
      }
    } catch (error: any) {
      console.error('Error fetching therapist responses:', error);
      message.error('Failed to fetch therapist responses: ' + error.message);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle action on therapist response
  const handleAction = async (bookingId: string, action: 'confirm' | 'cancel' | 'reschedule', values: any) => {
    try {
      setActionLoading(bookingId);
      
      const payload: any = { action };
      if (action === 'reschedule') {
        payload.newDate = values.newDate.format('YYYY-MM-DD');
        payload.newTime = values.newTime.format('HH:mm');
      }
      if (values.notes) {
        payload.notes = values.notes;
      }
      
      const response = await makeAuthenticatedRequest(`/api/business/therapist-responses/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        message.success(`Booking ${action} action completed successfully`);
        setActionModalVisible(false);
        actionForm.resetFields();
        await fetchTherapistResponses(); // Refresh the list
      } else {
        message.error(response.error || `Failed to ${action} booking`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing booking:`, error);
      message.error(`Failed to ${action} booking: ` + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Show action modal
  const showActionModal = (response: TherapistResponse, action: 'confirm' | 'cancel' | 'reschedule') => {
    setSelectedResponse(response);
    actionForm.setFieldsValue({
      action,
      notes: response.notes || ''
    });
    setActionModalVisible(true);
  };

  // Show response details modal
  const showResponseDetails = (response: TherapistResponse) => {
    setSelectedResponse(response);
    setModalVisible(true);
  };

  // Hide modals
  const hideResponseDetails = () => {
    setModalVisible(false);
    setSelectedResponse(null);
  };

  const hideActionModal = () => {
    setActionModalVisible(false);
    setSelectedResponse(null);
    actionForm.resetFields();
  };

  // Initial data loading
  useEffect(() => {
    fetchTherapistResponses();
  }, []);

  // Columns for responses table
  const columns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'firstName'],
      key: 'customer',
      render: (_: any, record: TherapistResponse) => (
        <div>
          <div><UserOutlined /> {record.customer.firstName} {record.customer.lastName}</div>
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
      render: (_: any, record: TherapistResponse) => (
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
      render: (_: any, record: TherapistResponse) => (
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
      render: (_: any, record: TherapistResponse) => (
        <div>
          <div><CalendarOutlined /> {new Date(record.date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.time}
          </div>
          {record.originalDate && record.originalTime && (
            <div style={{ fontSize: '11px', color: '#1890ff', marginTop: '4px' }}>
              <SyncOutlined /> Original: {new Date(record.originalDate).toLocaleDateString()} at {record.originalTime}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        // Map status to display text and styling
        const statusConfig = {
          'therapist_confirmed': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Therapist Confirmed' },
          'therapist_rejected': { color: 'red', icon: <CloseCircleOutlined />, text: 'Therapist Rejected' },
          'confirmed': { color: 'green', icon: <CheckCircleOutlined />, text: 'Confirmed' },
          'cancelled': { color: 'red', icon: <CloseCircleOutlined />, text: 'Cancelled' },
          'rescheduled': { color: 'blue', icon: <SyncOutlined />, text: 'Rescheduled' },
          'paid': { color: 'green', icon: <DollarOutlined />, text: 'Paid' },
          'pending': { color: 'gold', icon: <ClockCircleOutlined />, text: 'Pending' },
          'no_show': { color: 'volcano', icon: <CloseCircleOutlined />, text: 'No Show' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || 
                      { color: 'blue', icon: <ClockCircleOutlined />, text: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') };
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TherapistResponse) => {
        // Determine which actions are available based on current status
        const isConfirmed = record.status === 'confirmed';
        const isCancelled = record.status === 'cancelled';
        const isTherapistResponded = record.status === 'therapist_confirmed' || record.status === 'therapist_rejected';
        
        // Show Confirm button for ALL bookings displayed in the booking response section
        // The button should remain visible until business explicitly clicks it
        // This ensures business can confirm any therapist response regardless of payment status
        
        return (
          <Space>
            {/* Show Confirm button for ALL displayed bookings */}
            {/* The button should remain visible until business explicitly clicks it */}
            {/* This ensures business can confirm any therapist response regardless of payment status */}
            <Button 
              type="primary" 
              size="small"
              onClick={() => showActionModal(record, 'confirm')}
              loading={actionLoading === record.id}
            >
              Confirm
            </Button>
            
            {/* Show Cancel button for confirmed bookings or therapist responses */}
            {(isConfirmed || isTherapistResponded) && (
              <Button 
                type="primary" 
                danger
                size="small"
                onClick={() => showActionModal(record, 'cancel')}
                loading={actionLoading === record.id}
              >
                Cancel
              </Button>
            )}
            
            {/* Show Reschedule button only for confirmed bookings */}
            {isConfirmed && (
              <Button 
                type="default"
                size="small"
                onClick={() => showActionModal(record, 'reschedule')}
                loading={actionLoading === record.id}
              >
                Reschedule
              </Button>
            )}
            
            {/* View Details button always available */}
            <Button 
              type="link" 
              size="small"
              onClick={() => showResponseDetails(record)}
            >
              View Details
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card 
        title={
          <span>
            <HistoryOutlined />
            Therapist Responses
          </span>
        }
        extra={
          <Button 
            icon={<HistoryOutlined />}
            onClick={fetchTherapistResponses}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              Loading therapist responses...
            </div>
          </div>
        ) : responses.length > 0 ? (
          <Table
            dataSource={responses}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} responses`
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <HistoryOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <div>No Therapist Responses</div>
            <div style={{ color: '#888', marginTop: 8 }}>
              There are currently no therapist responses to display.
            </div>
          </div>
        )}
      </Card>

      {/* Response Details Modal */}
      <Modal
        title="Response Details"
        open={modalVisible}
        onCancel={hideResponseDetails}
        footer={[
          <Button key="close" onClick={hideResponseDetails}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedResponse && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Booking ID">
              {selectedResponse.id}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Name">
              {selectedResponse.customer.firstName} {selectedResponse.customer.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Email">
              {selectedResponse.customer.email}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Phone">
              {selectedResponse.customer.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Service">
              {selectedResponse.service.name}
            </Descriptions.Item>
            <Descriptions.Item label="Service Price">
              {formatCurrency(selectedResponse.service.price, selectedResponse.service.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Service Duration">
              {selectedResponse.service.duration} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Therapist">
              {selectedResponse.therapist.fullName} ({selectedResponse.therapist.professionalTitle})
            </Descriptions.Item>
            <Descriptions.Item label="Booking Date">
              {new Date(selectedResponse.date).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Booking Time">
              {selectedResponse.time}
            </Descriptions.Item>
            {selectedResponse.originalDate && (
              <Descriptions.Item label="Original Date">
                {new Date(selectedResponse.originalDate).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {selectedResponse.originalTime && (
              <Descriptions.Item label="Original Time">
                {selectedResponse.originalTime}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag 
                color={selectedResponse.status === 'therapist_confirmed' ? 'orange' : 
                      selectedResponse.status === 'therapist_rejected' ? 'red' : 
                      selectedResponse.status === 'confirmed' ? 'green' : 
                      selectedResponse.status === 'cancelled' ? 'red' : 
                      selectedResponse.status === 'rescheduled' ? 'blue' : 
                      selectedResponse.status === 'paid' ? 'green' : 
                      selectedResponse.status === 'pending' ? 'gold' : 
                      selectedResponse.status === 'no_show' ? 'volcano' : 'blue'}
                icon={selectedResponse.status === 'therapist_confirmed' ? <ClockCircleOutlined /> : 
                      selectedResponse.status === 'therapist_rejected' ? <CloseCircleOutlined /> : 
                      selectedResponse.status === 'confirmed' ? <CheckCircleOutlined /> : 
                      selectedResponse.status === 'cancelled' ? <CloseCircleOutlined /> : 
                      selectedResponse.status === 'rescheduled' ? <SyncOutlined /> : 
                      selectedResponse.status === 'paid' ? <DollarOutlined /> : 
                      selectedResponse.status === 'pending' ? <ClockCircleOutlined /> : 
                      selectedResponse.status === 'no_show' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
              >
                {selectedResponse.status === 'therapist_confirmed' ? 'Therapist Confirmed' : 
                 selectedResponse.status === 'therapist_rejected' ? 'Therapist Rejected' : 
                 selectedResponse.status === 'confirmed' ? 'Confirmed' : 
                 selectedResponse.status === 'cancelled' ? 'Cancelled' : 
                 selectedResponse.status === 'rescheduled' ? 'Rescheduled' : 
                 selectedResponse.status === 'paid' ? 'Paid' : 
                 selectedResponse.status === 'pending' ? 'Pending' : 
                 selectedResponse.status === 'no_show' ? 'No Show' : 
                 selectedResponse.status.charAt(0).toUpperCase() + selectedResponse.status.slice(1).replace(/_/g, ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Response Visible to Business Only">
              {selectedResponse.responseVisibleToBusinessOnly ? 'Yes' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned by Admin">
              {selectedResponse.assignedByAdmin ? 'Yes' : 'No'}
            </Descriptions.Item>
            {selectedResponse.assignedById && (
              <Descriptions.Item label="Assigned By ID">
                {selectedResponse.assignedById}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created At">
              {new Date(selectedResponse.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(selectedResponse.updatedAt).toLocaleString()}
            </Descriptions.Item>
            {selectedResponse.notes && (
              <Descriptions.Item label="Notes">
                {selectedResponse.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title="Take Action on Therapist Response"
        open={actionModalVisible}
        onCancel={hideActionModal}
        footer={null}
        width={600}
      >
        {selectedResponse && (
          <Form
            form={actionForm}
            layout="vertical"
            onFinish={(values) => {
              const action = actionForm.getFieldValue('action');
              handleAction(selectedResponse.id, action as any, values);
            }}
          >
            <Form.Item label="Booking ID" initialValue={selectedResponse.id}>
              <Input value={selectedResponse.id} disabled />
            </Form.Item>
            
            <Form.Item label="Customer" initialValue={`${selectedResponse.customer.firstName} ${selectedResponse.customer.lastName}`}>
              <Input value={`${selectedResponse.customer.firstName} ${selectedResponse.customer.lastName}`} disabled />
            </Form.Item>
            
            <Form.Item label="Service" initialValue={selectedResponse.service.name}>
              <Input value={selectedResponse.service.name} disabled />
            </Form.Item>
            
            <Form.Item label="Current Date & Time" initialValue={`${new Date(selectedResponse.date).toLocaleDateString()} at ${selectedResponse.time}`}>
              <Input value={`${new Date(selectedResponse.date).toLocaleDateString()} at ${selectedResponse.time}`} disabled />
            </Form.Item>
            
            <Form.Item label="Current Status" initialValue={selectedResponse.status}>
              <Tag 
                color={selectedResponse.status === 'therapist_confirmed' ? 'orange' : 
                      selectedResponse.status === 'therapist_rejected' ? 'red' : 
                      selectedResponse.status === 'confirmed' ? 'green' : 
                      selectedResponse.status === 'cancelled' ? 'red' : 
                      selectedResponse.status === 'rescheduled' ? 'blue' : 
                      selectedResponse.status === 'paid' ? 'green' : 
                      selectedResponse.status === 'pending' ? 'gold' : 
                      selectedResponse.status === 'no_show' ? 'volcano' : 'blue'}
                icon={selectedResponse.status === 'therapist_confirmed' ? <ClockCircleOutlined /> : 
                      selectedResponse.status === 'therapist_rejected' ? <CloseCircleOutlined /> : 
                      selectedResponse.status === 'confirmed' ? <CheckCircleOutlined /> : 
                      selectedResponse.status === 'cancelled' ? <CloseCircleOutlined /> : 
                      selectedResponse.status === 'rescheduled' ? <SyncOutlined /> : 
                      selectedResponse.status === 'paid' ? <DollarOutlined /> : 
                      selectedResponse.status === 'pending' ? <ClockCircleOutlined /> : 
                      selectedResponse.status === 'no_show' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
              >
                {selectedResponse.status === 'therapist_confirmed' ? 'Therapist Confirmed' : 
                 selectedResponse.status === 'therapist_rejected' ? 'Therapist Rejected' : 
                 selectedResponse.status === 'confirmed' ? 'Confirmed' : 
                 selectedResponse.status === 'cancelled' ? 'Cancelled' : 
                 selectedResponse.status === 'rescheduled' ? 'Rescheduled' : 
                 selectedResponse.status === 'paid' ? 'Paid' : 
                 selectedResponse.status === 'pending' ? 'Pending' : 
                 selectedResponse.status === 'no_show' ? 'No Show' : 
                 selectedResponse.status.charAt(0).toUpperCase() + selectedResponse.status.slice(1).replace(/_/g, ' ')}
              </Tag>
            </Form.Item>
            
            <Form.Item 
              name="action" 
              label="Action" 
              rules={[{ required: true, message: 'Please select an action' }]}
            >
              <div>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={() => actionForm.setFieldsValue({ action: 'confirm' })}
                    danger={actionForm.getFieldValue('action') !== 'confirm'}
                  >
                    Confirm
                  </Button>
                  <Button 
                    type="primary" 
                    danger
                    onClick={() => actionForm.setFieldsValue({ action: 'cancel' })}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="default"
                    onClick={() => actionForm.setFieldsValue({ action: 'reschedule' })}
                  >
                    Reschedule
                  </Button>
                </Space>
              </div>
            </Form.Item>
            
            {actionForm.getFieldValue('action') === 'reschedule' && (
              <>
                <Form.Item label="New Date" name="newDate" rules={[{ required: true, message: 'Please select a new date' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item label="New Time" name="newTime" rules={[{ required: true, message: 'Please select a new time' }]}>
                  <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                </Form.Item>
              </>
            )}
            
            <Form.Item label="Notes" name="notes">
              <Input.TextArea placeholder="Add any notes about this action..." rows={3} />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button onClick={hideActionModal}>Cancel</Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={actionLoading === selectedResponse.id}
                >
                  Submit Action
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TherapistResponseManager;