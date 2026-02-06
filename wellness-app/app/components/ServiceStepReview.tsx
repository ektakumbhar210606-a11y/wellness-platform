import React from 'react';
import { Typography, Descriptions, Tag, Space, Divider, Button } from 'antd';
import { formatCurrency } from '../../utils/currencyFormatter';

const { Title, Text } = Typography;

interface ServiceStepReviewProps {
  formData: any;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
  isEditing: boolean;
  businessCountry?: string;
}

const ServiceStepReview: React.FC<ServiceStepReviewProps> = ({ 
  formData,
  onPrev,
  onSubmit,
  loading,
  isEditing,
  businessCountry
}) => {
  return (
    <div>
      <Title level={4}>Review Your Service</Title>
      <Text>Please review your service details before submitting</Text>
      
      <div className="mt-6">
        <Title level={5}>Service Details</Title>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Service Name">
            {formData.name || <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Price">
            {formData.price !== undefined ? formatCurrency(formData.price, businessCountry || 'USA') : <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Duration">
            {formData.duration ? `${formData.duration} minutes` : <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {formData.description || <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Title level={5}>Media</Title>
        <Space wrap>
          {formData.images && formData.images.length > 0 ? (
            <Tag color="blue">{formData.images.length} image(s) uploaded</Tag>
          ) : (
            <Text type="secondary">No images uploaded</Text>
          )}
        </Space>
        
        <Divider />
        
        <Title level={5}>Team Members</Title>
        {formData.teamMembers && formData.teamMembers.length > 0 ? (
          <div>
            {formData.teamMembers.map((member: any, index: number) => (
              <div key={member.id || index} className="mb-2">
                <Text strong>{member.name || 'Unnamed'}</Text> - {member.role || 'No role specified'} 
                {member.experience !== undefined && ` (${member.experience} years experience)`}
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">No team members added</Text>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button style={{ marginRight: 8 }} onClick={onPrev}>
          Previous
        </Button>
        <Button 
          type="primary" 
          onClick={onSubmit}
          loading={loading}
        >
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </div>
  );
};

export default ServiceStepReview;