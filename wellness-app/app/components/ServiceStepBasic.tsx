import React from 'react';
import { Form, Input, InputNumber, Select, Typography } from 'antd';

const { TextArea } = Input;
const { Title } = Typography;

interface ServiceStepBasicProps {
  formData: any;
  setFormData: (data: any) => void;
}

const ServiceStepBasic: React.FC<ServiceStepBasicProps> = ({ formData, setFormData }) => {
  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div>
      <Title level={4}>Service Basic Details</Title>
      <Form layout="vertical">
        <Form.Item 
          label="Service Name" 
          required
          validateStatus={formData.name ? '' : 'error'}
          help={!formData.name ? 'Service name is required' : ''}
        >
          <Input
            placeholder="Enter service name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        </Form.Item>

        <Form.Item 
          label="Price ($)" 
          required
          validateStatus={formData.price !== undefined ? '' : 'error'}
          help={formData.price === undefined ? 'Price is required' : ''}
        >
          <InputNumber
            placeholder="Enter price"
            min={0}
            step={0.01}
            value={formData.price}
            onChange={(value) => handleFieldChange('price', value)}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item 
          label="Duration" 
          required
          validateStatus={formData.duration !== undefined ? '' : 'error'}
          help={formData.duration === undefined ? 'Duration is required' : ''}
        >
          <Select
            placeholder="Select duration"
            value={formData.duration}
            onChange={(value) => handleFieldChange('duration', value)}
          >
            <Select.Option value={30}>30 minutes</Select.Option>
            <Select.Option value={45}>45 minutes</Select.Option>
            <Select.Option value={60}>60 minutes</Select.Option>
            <Select.Option value={90}>90 minutes</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Description" 
          required
          validateStatus={formData.description ? '' : 'error'}
          help={!formData.description ? 'Description is required' : ''}
        >
          <TextArea
            rows={4}
            placeholder="Enter service description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ServiceStepBasic;