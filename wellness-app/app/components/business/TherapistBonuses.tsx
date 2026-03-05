'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Select, 
  Button, 
  Table, 
  Space, 
  Spin, 
  Alert,
  Tag,
  Modal
} from 'antd';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';

const { Title, Text } = Typography;
const { Option } = Select;

interface Therapist {
  id: string;
  name: string;
}

interface Bonus {
  id: string;
  therapistId: string;
  therapistName: string;
  month: number;
  year: number;
  averageRating: number;
  totalReviews: number;
  bonusAmount: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

const TherapistBonuses: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBonuses, setLoadingBonuses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculateError, setCalculateError] = useState<string | null>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);

  // Form states
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalBonusId, setModalBonusId] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);

  // Get last 3 years for dropdown
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch therapists associated with this business
      const therapistsResponse = await makeAuthenticatedRequest('/api/business/therapists');
      if (therapistsResponse.success && therapistsResponse.data) {
        // Combine approved and pending therapists
        const allTherapists = [
          ...(therapistsResponse.data.approvedTherapists || []),
          ...(therapistsResponse.data.pendingTherapists || [])
        ].map(therapist => ({
          id: therapist.therapistId || therapist.id, // Use therapist profile ID, not user ID
          name: `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || therapist.fullName || 'Unknown Therapist'
        }));
        
        setTherapists(allTherapists);
      } else {
        setTherapists([]);
      }
      
      // Fetch all bonuses
      await fetchBonuses();
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBonuses = async () => {
    try {
      setLoadingBonuses(true);
      const response = await makeAuthenticatedRequest('/api/bonus');
      if (response.success) {
        setBonuses(response.bonuses || []);
      } else {
        setBonuses([]);
      }
    } catch (err: any) {
      console.error('Error fetching bonuses:', err);
      setBonuses([]);
    } finally {
      setLoadingBonuses(false);
    }
  };

  const handleCalculateBonus = async () => {
    if (!selectedTherapist) {
      setCalculateError('Please select a therapist');
      return;
    }

    try {
      setCalculateLoading(true);
      setCalculateError(null);

      const response = await makeAuthenticatedRequest('/api/bonus/calculate', {
        method: 'POST',
        body: JSON.stringify({
          therapistId: selectedTherapist,
          month: selectedMonth,
          year: selectedYear
        })
      });

      if (response.success) {
        // Refresh the bonuses list
        await fetchBonuses();
        setCalculateError(null);
      } else {
        // Check if it's an eligibility issue or other error
        if (response.message === 'Not eligible') {
          setCalculateError(`Therapist is not eligible for bonus. Average rating: ${response.averageRating}, Total reviews: ${response.totalReviews}`);
        } else {
          setCalculateError(response.error || 'Failed to calculate bonus');
        }
      }
    } catch (err: any) {
      console.error('Error calculating bonus:', err);
      setCalculateError(err.message || 'Failed to calculate bonus');
    } finally {
      setCalculateLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setModalLoading(true);
      
      const response = await makeAuthenticatedRequest(`/api/bonus/pay/${modalBonusId}`, {
        method: 'PATCH'
      });

      if (response.success) {
        // Close modal and refresh bonuses
        setModalVisible(false);
        await fetchBonuses();
      } else {
        setError(response.error || 'Failed to update bonus status');
      }
    } catch (err: any) {
      console.error('Error updating bonus status:', err);
      setError(err.message || 'Failed to update bonus status');
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      title: 'Therapist Name',
      dataIndex: 'therapistName',
      key: 'therapistName',
      sorter: (a: Bonus, b: Bonus) => a.therapistName.localeCompare(b.therapistName),
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
      title: 'Average Rating',
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
      title: 'Total Reviews',
      dataIndex: 'totalReviews',
      key: 'totalReviews',
      sorter: (a: Bonus, b: Bonus) => (a.totalReviews || 0) - (b.totalReviews || 0),
    },
    {
      title: 'Bonus Amount',
      dataIndex: 'bonusAmount',
      key: 'bonusAmount',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold' }}>
          ${amount ? amount.toLocaleString() : '0'}
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bonus) => (
        <Space size="middle">
          {record.status === 'pending' ? (
            <Button 
              type="primary" 
              danger
              size="small"
              onClick={() => {
                setModalBonusId(record.id);
                setModalVisible(true);
              }}
            >
              Mark as Paid
            </Button>
          ) : (
            <Text type="secondary">Paid</Text>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading therapist bonuses...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px', color: '#1d3557' }}>
        Therapist Monthly Bonuses
      </Title>

      {error && (
        <Alert
          title="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Calculate Bonus Section */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px', color: '#1d3557' }}>
          Calculate New Bonus
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Therapist</Text>
            <Select 
              value={selectedTherapist} 
              onChange={setSelectedTherapist} 
              placeholder="Select Therapist"
              style={{ width: '100%' }}
              loading={loading}
              disabled={loading}
            >
              {therapists.map(therapist => (
                <Option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={8}>
            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Month</Text>
            <Select 
              value={selectedMonth} 
              onChange={setSelectedMonth} 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <Option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString('default', { month: 'short' })}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={8}>
            <Text strong style={{ display: 'block', marginBottom: '4px' }}>Year</Text>
            <Select 
              value={selectedYear} 
              onChange={setSelectedYear} 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        
        <div style={{ marginTop: '16px' }}>
          <Button 
            type="primary" 
            onClick={handleCalculateBonus}
            loading={calculateLoading}
            disabled={loading}
          >
            Calculate Bonus
          </Button>
        </div>
        
        {calculateError && (
          <Alert
            title="Calculation Error"
            description={calculateError}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {/* Bonuses Table */}
      <Card>
        <Title level={5} style={{ marginBottom: '16px', color: '#1d3557' }}>
          Bonus History
        </Title>
        
        {loadingBonuses ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Loading bonuses...</Text>
            </div>
          </div>
        ) : (
          <Table 
            dataSource={bonuses} 
            columns={columns} 
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bonuses`
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Confirmation Modal for Mark as Paid */}
      <Modal
        title="Confirm Payment"
        open={modalVisible}
        onOk={handleMarkAsPaid}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalLoading}
      >
        <p>Are you sure you want to mark this bonus as paid?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default TherapistBonuses;