import React, { useState, useEffect } from 'react';
import { Form, Select, Typography, Card, Spin, Alert, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// Import expertise constants
import { EXPERTISE_OPTIONS } from '@/lib/constants/expertiseConstants';

const { Title, Text } = Typography;
const { Option } = Select;

interface ServiceStepTeamProps {
  formData: any;
  setFormData: (data: any) => void;
  approvedTherapists?: any[]; // List of approved therapists for this business
  loadingTherapists?: boolean;
  onNext: () => void;
  onPrev: () => void;
  current: number;
  totalSteps: number;
}

const ServiceStepTeam: React.FC<ServiceStepTeamProps> = ({ 
  formData, 
  setFormData,
  approvedTherapists = [],
  loadingTherapists = false,
  onNext,
  onPrev,
  current,
  totalSteps
}) => {
  const [filteredTherapists, setFilteredTherapists] = useState<any[]>(approvedTherapists);
  const [selectedTherapists, setSelectedTherapists] = useState<string[]>(
    formData.therapists && Array.isArray(formData.therapists) 
      ? formData.therapists.filter((id: string | null | undefined) => id != null && id !== '') 
      : []
  );

  // Recalculate filtered therapists when service name or approvedTherapists change
  useEffect(() => {
    const getFilteredTherapists = () => {
      // If no service name is selected, return all approved therapists
      if (!formData.name) {
        return approvedTherapists;
      }

      // Find the expertise ID that corresponds to the selected service name
      const normalizedServiceName = formData.name.trim().toLowerCase();
      const matchedExpertise = EXPERTISE_OPTIONS.find(expertise => 
        expertise.label.trim().toLowerCase() === normalizedServiceName
      );

      if (matchedExpertise) {
        // Filter therapists whose expertise includes the matched expertise
        return approvedTherapists.filter(therapist => {
          // Check therapist.areaOfExpertise field from API response (which is what the API returns)
          const therapistExpertise = therapist.areaOfExpertise || [];
          return Array.isArray(therapistExpertise) && 
                 therapistExpertise.includes(matchedExpertise.id);
        });
      } else {
        // If no match found, return all approved therapists
        return approvedTherapists;
      }
    };

    const result = getFilteredTherapists();
    setFilteredTherapists(result);
  }, [formData.name, approvedTherapists, EXPERTISE_OPTIONS]);

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
    return therapist.fullName || therapist.fullname || 
           `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || 
           therapist.email || 
           `Therapist ${(therapist.id || therapist._id || therapist.therapistId)}`;
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
      ) : (
        <div className="mt-4">
          <Card>
            <Form layout="vertical">
              <Form.Item 
                label="Select Therapists" 
                required={false}
                help={`Choose one or more therapists whose expertise matches the selected service (${formData.name || 'no service selected'})`}
              >
                <Select
                  mode="multiple"
                  placeholder="Select therapists"
                  value={selectedTherapists.filter(id => id != null && id !== '')}
                  onChange={handleTherapistChange}
                  optionLabelProp="label"
                  style={{ width: '100%' }}
                >
                  {filteredTherapists.length === 0 ? (
                    <Option key="no-match" value="" disabled>
                      No matching therapists found for "{formData.name || 'the selected service'}"
                    </Option>
                  ) : (
                    filteredTherapists
                      .filter(therapist => (therapist.id || therapist._id || therapist.therapistId) && (therapist.id || therapist._id || therapist.therapistId) !== '')
                      .map((therapist, index) => (
                        <Option 
                          key={`${therapist.id || therapist._id || therapist.therapistId}-${index}`} 
                          value={therapist.id || therapist._id || therapist.therapistId}
                          label={formatTherapistName(therapist)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            <div>
                              <div>{formatTherapistName(therapist)}</div>
                              <div style={{ fontSize: '12px', color: '#888' }}>
                                {therapist.email || (therapist.user && therapist.user.email) || therapist.firstName + ' ' + therapist.lastName || 'No email'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#888' }}>
                                Experience: {therapist.experience || 0} years
                              </div>
                            </div>
                          </div>
                        </Option>
                      ))
                  )}
                </Select>
              </Form.Item>
            </Form>
          </Card>
          
          {selectedTherapists.length > 0 && (
            <Card title="Selected Therapists" style={{ marginTop: 16 }}>
              {selectedTherapists.map((therapistId) => {
                const therapist = filteredTherapists.find(t => 
                  (t.id === therapistId) || (t._id === therapistId) || (t.therapistId === therapistId)
                );
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
                          {therapist.email || (therapist.user && therapist.user.email) || therapist.firstName + ' ' + therapist.lastName || 'No email'} • {therapist.experience || 0} years experience
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
      
      {/* Navigation buttons */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button style={{ marginRight: 8 }} onClick={onPrev}>
          Previous
        </Button>
        {current < totalSteps - 1 && (
          <Button type="primary" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceStepTeam;