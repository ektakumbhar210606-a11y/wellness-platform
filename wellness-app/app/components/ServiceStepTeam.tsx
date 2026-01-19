import React from 'react';
import { Form, Input, InputNumber, Button, Space, Typography, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ServiceStepTeamProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ServiceStepTeam: React.FC<ServiceStepTeamProps> = ({ formData, setFormData }) => {
  const addMember = () => {
    const newMember = {
      id: Date.now(),
      name: '',
      role: '',
      experience: undefined,
    };
    
    setFormData({
      ...formData,
      teamMembers: [...(formData.teamMembers || []), newMember],
    });
  };

  const removeMember = (index: number) => {
    const updatedMembers = [...(formData.teamMembers || [])];
    updatedMembers.splice(index, 1);
    setFormData({
      ...formData,
      teamMembers: updatedMembers,
    });
  };

  const updateMember = (index: number, field: string, value: any) => {
    const updatedMembers = [...(formData.teamMembers || [])];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      teamMembers: updatedMembers,
    });
  };

  return (
    <div>
      <Title level={4}>Team Members</Title>
      <Text type="secondary">Add team members who will provide this service (optional)</Text>
      
      <div className="mt-4">
        {(formData.teamMembers || []).map((member: any, index: number) => (
          <Card 
            key={member.id || index} 
            className="mb-4"
            extra={
              <Button 
                type="link" 
                danger 
                icon={<MinusCircleOutlined />}
                onClick={() => removeMember(index)}
              />
            }
          >
            <Form layout="vertical">
              <Form.Item label={`Member ${index + 1} Name`} required={false}>
                <Input
                  placeholder="Enter member name"
                  value={member.name}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                />
              </Form.Item>
              
              <Form.Item label="Role" required={false}>
                <Input
                  placeholder="Enter role"
                  value={member.role}
                  onChange={(e) => updateMember(index, 'role', e.target.value)}
                />
              </Form.Item>
              
              <Form.Item label="Experience (years)" required={false}>
                <InputNumber
                  placeholder="Years of experience"
                  min={0}
                  value={member.experience}
                  onChange={(value) => updateMember(index, 'experience', value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form>
          </Card>
        ))}
        
        <Button 
          type="dashed" 
          onClick={addMember}
          block
          icon={<PlusOutlined />}
        >
          Add Team Member
        </Button>
      </div>
    </div>
  );
};

export default ServiceStepTeam;