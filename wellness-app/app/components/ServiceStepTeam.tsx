import React, { useState, useEffect } from 'react';
import { Form, Select, Typography, Card, Spin, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface ServiceStepTeamProps {
  formData: any;
  setFormData: (data: any) => void;
  approvedTherapists?: any[]; // List of approved therapists for this business
  loadingTherapists?: boolean;
}

const ServiceStepTeam: React.FC<ServiceStepTeamProps> = ({ 
  formData, 
  setFormData,
  approvedTherapists = [],
  loadingTherapists = false
}) => {
  const [selectedTherapists, setSelectedTherapists] = useState<string[]>(
    formData.therapists || []
  );

  // Update form data when selected therapists change
  useEffect(() => {
    setFormData({
      ...formData,
      therapists: selectedTherapists
    });
  }, [selectedTherapists]);

  const handleTherapistChange = (therapistIds: string[]) => {
    setSelectedTherapists(therapistIds);
  };

  const formatTherapistName = (therapist: any) => {
    return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || 
           therapist.email || 
           `Therapist ${therapist._id}`;
  };

  return (
    <div>
      <Title level={4}>Assign Therapists</Title>
      <Text type="secondary">Select approved therapists who can provide this service</Text>
      
      {loadingTherapists ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading approved therapists...</Text>
          </div>
        </div>
      ) : approvedTherapists.length === 0 ? (
        <Alert
          message="No Approved Therapists"
          description="You don't have any approved therapists yet. Please approve therapist requests first before assigning them to services."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      ) : (
        <div className="mt-4">
          <Card>
            <Form layout="vertical">
              <Form.Item 
                label="Select Therapists" 
                required={false}
                help="Choose one or more therapists who are approved to provide this service"
              >
                <Select
                  mode="multiple"
                  placeholder="Select therapists"
                  value={selectedTherapists}
                  onChange={handleTherapistChange}
                  optionLabelProp="label"
                  style={{ width: '100%' }}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      {approvedTherapists.length > 0 && (
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', color: '#666' }}>
                          {approvedTherapists.length} approved therapist{approvedTherapists.length !== 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>
                  )}
                >
                  {approvedTherapists.map((therapist) => (
                    <Option 
                      key={therapist._id} 
                      value={therapist._id}
                      label={formatTherapistName(therapist)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <div>
                          <div>{formatTherapistName(therapist)}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            {therapist.email}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            Experience: {therapist.experience || 0} years
                          </div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>
          
          {selectedTherapists.length > 0 && (
            <Card title="Selected Therapists" style={{ marginTop: 16 }}>
              {selectedTherapists.map((therapistId) => {
                const therapist = approvedTherapists.find(t => t._id === therapistId);
                return (
                  <div key={therapistId} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <UserOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    <div>
                      <strong>{therapist ? formatTherapistName(therapist) : 'Unknown Therapist'}</strong>
                      {therapist && (
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {therapist.email} • {therapist.experience || 0} years experience
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceStepTeam;