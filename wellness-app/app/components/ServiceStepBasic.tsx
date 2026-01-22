import React, { useRef } from 'react';
import { Form, Input, InputNumber, Select, Typography, Button } from 'antd';

const { TextArea } = Input;
const { Title } = Typography;

interface ServiceStepBasicProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  current: number;
  totalSteps: number;
}

const ServiceStepBasic: React.FC<ServiceStepBasicProps> = ({ 
  formData, 
  setFormData, 
  onNext,
  onPrev,
  current,
  totalSteps
}) => {
  const [form] = Form.useForm();
  
  // Handle field changes and update parent state
  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle form submission/validation
  const handleNext = async () => {
    try {
      // Validate all fields before proceeding
      await form.validateFields();
      onNext();
    } catch (error) {
      // Ant Design will show validation errors automatically
      console.log('Form validation failed:', error);
    }
  };

  return (
    <div>
      <Title level={4}>Service Basic Details</Title>
      {/* 
        Ant Design Form with proper validation:
        - validateTrigger={['onBlur', 'onSubmit']} prevents immediate validation on render
        - rules define validation requirements
        - No manual validateStatus/help props that cause premature errors
      */}
      <Form 
        form={form}
        layout="vertical"
        initialValues={formData}
        validateTrigger={['onBlur', 'onSubmit']}
      >
        <Form.Item 
          label="Service Name" 
          name="name"
          rules={[
            { 
              required: true, 
              message: 'Service name is required' 
            },
            { 
              min: 2, 
              message: 'Service name must be at least 2 characters' 
            },
            { 
              max: 100, 
              message: 'Service name cannot exceed 100 characters' 
            }
          ]}
        >
          <Input
            placeholder="Enter service name"
            onChange={(e) => handleFieldChange('name', e.target.value)}
          />
        </Form.Item>

        <Form.Item 
          label="Price ($)" 
          name="price"
          rules={[
            { 
              required: true, 
              message: 'Price is required' 
            },
            { 
              type: 'number',
              min: 0, 
              message: 'Price cannot be negative' 
            },
            { 
              type: 'number',
              max: 9999.99, 
              message: 'Price cannot exceed $9,999.99' 
            }
          ]}
        >
          <InputNumber
            placeholder="Enter price"
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            onChange={(value) => handleFieldChange('price', value)}
          />
        </Form.Item>

        <Form.Item 
          label="Duration" 
          name="duration"
          rules={[
            { 
              required: true, 
              message: 'Duration is required' 
            },
            { 
              type: 'number',
              min: 1, 
              message: 'Duration must be at least 1 minute' 
            },
            { 
              type: 'number',
              max: 480, 
              message: 'Duration cannot exceed 480 minutes (8 hours)' 
            }
          ]}
        >
          <Select
            placeholder="Select duration"
            onChange={(value) => handleFieldChange('duration', value)}
          >
            <Select.Option value={15}>15 minutes</Select.Option>
            <Select.Option value={30}>30 minutes</Select.Option>
            <Select.Option value={45}>45 minutes</Select.Option>
            <Select.Option value={60}>60 minutes</Select.Option>
            <Select.Option value={90}>90 minutes</Select.Option>
            <Select.Option value={120}>120 minutes</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Description" 
          name="description"
          rules={[
            { 
              required: true, 
              message: 'Description is required' 
            },
            { 
              min: 10, 
              message: 'Description must be at least 10 characters' 
            },
            { 
              max: 500, 
              message: 'Description cannot exceed 500 characters' 
            }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Enter service description"
            onChange={(e) => handleFieldChange('description', e.target.value)}
          />
        </Form.Item>
      </Form>
      
      {/* Navigation buttons */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        {current > 0 && (
          <Button style={{ marginRight: 8 }} onClick={onPrev}>
            Previous
          </Button>
        )}
        {current < totalSteps - 1 && (
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceStepBasic;