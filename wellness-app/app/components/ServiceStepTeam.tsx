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

  // Filter therapists based on their expertise matching the selected service name
  const getFilteredTherapists = () => {
    // If no service name is selected, return all approved therapists
    if (!formData.name) {
      return approvedTherapists;
    }

    // Find the expertise ID that corresponds to the selected service name
    // We need to normalize both strings for comparison
    const normalizedServiceName = formData.name.trim().toLowerCase();
    const matchedExpertise = EXPERTISE_OPTIONS.find(expertise => 
      expertise.label.trim().toLowerCase() === normalizedServiceName
    );

    if (matchedExpertise) {
      // Filter therapists whose expertise includes the matched expertise
      return approvedTherapists.filter(therapist => {
        // Log therapist data for debugging
        console.log('Checking therapist:', therapist._id, 'Expertise:', therapist.areaOfExpertise);
        
        return therapist.areaOfExpertise && 
        Array.isArray(therapist.areaOfExpertise) && 
        therapist.areaOfExpertise.includes(matchedExpertise.id);
      });
    } else {
      // If no exact match found, return all approved therapists
      console.log("No expertise match found for:", formData.name, "Available options:", EXPERTISE_OPTIONS.map(e => e.label));
      return approvedTherapists;
    }
  };

  const [filteredTherapists, setFilteredTherapists] = useState<any[]>(approvedTherapists);

  console.log('Service Name:', formData.name);
  console.log('All approved therapists:', approvedTherapists);
  console.log('Filtered therapists:', filteredTherapists);
  
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
      // We need to normalize both strings for comparison
      const normalizedServiceName = formData.name.trim().toLowerCase();
      const matchedExpertise = EXPERTISE_OPTIONS.find(expertise => 
        expertise.label.trim().toLowerCase() === normalizedServiceName
      );

      if (matchedExpertise) {
        // Filter therapists whose expertise includes the matched expertise
        return approvedTherapists.filter(therapist => {
          // Log therapist data for debugging
          console.log('Checking therapist:', therapist._id, 'Expertise:', therapist.areaOfExpertise);
          
          return therapist.areaOfExpertise && 
          Array.isArray(therapist.areaOfExpertise) && 
          therapist.areaOfExpertise.includes(matchedExpertise.id);
        });
      } else {
        // If no exact match found, return all approved therapists
        console.log("No expertise match found for:", formData.name, "Available options:", EXPERTISE_OPTIONS.map(e => e.label));
        return approvedTherapists;
      }
    };

    setFilteredTherapists(getFilteredTherapists());
  }, [formData.name, approvedTherapists]);

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
    console.log(therapist)
    return therapist.fullName || `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || 
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
      ) : filteredTherapists.length === 0 ? (
        <Alert
          message="No Matching Therapists"
          description={`There are no approved therapists with expertise matching "${formData.name || 'the selected service'}". Please select a different service or assign therapists from the general list.`}
          type="warning"
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
                help="Choose one or more therapists whose expertise matches the selected service"
              >
                <Select
                  mode="multiple"
                  placeholder="Select therapists"
                  value={selectedTherapists.filter(id => id != null && id !== '')}
                  onChange={handleTherapistChange}
                  optionLabelProp="label"
                  style={{ width: '100%' }}
                  popupRender={(menu) => (
                    <div>
                      {menu}
                      {filteredTherapists.length > 0 && (
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', color: '#666' }}>
                          {filteredTherapists.length} matching therapist{filteredTherapists.length !== 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>
                  )}
                >
                  {filteredTherapists
                    .filter(therapist => therapist._id && therapist._id !== '')
                    .map((therapist) => (
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
                console.log('therapistId', therapistId)
                const therapist = filteredTherapists.find(t => t._id === therapistId);
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