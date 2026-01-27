import React, { useRef, useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Typography, Button } from 'antd';

const { TextArea } = Input;
const { Title } = Typography;

interface ServiceFormData {
  serviceCategoryId?: string;
  price?: number;
  duration?: number;
  description?: string;
  name?: string;
  images?: string[];
  teamMembers?: string[];
  therapists?: string[];
  isEditing?: boolean;
  [key: string]: any;
}

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
  const [serviceCategories, setServiceCategories] = useState<{id: string, name: string}[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch service categories
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch('/api/service-categories');
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setServiceCategories(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch service categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchServiceCategories();
  }, []);
  
  // Update form fields when formData changes
  React.useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData, form]);
  
  // Handle field changes and update parent state
  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Also update the form's internal state to keep it in sync
    form.setFieldsValue({ [field]: value });
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
      <Title level={4} className="responsive-h4">Service Basic Details</Title>
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
        onValuesChange={(changedValues) => {
          // Update parent state when form values change
          const fieldName = Object.keys(changedValues)[0];
          const fieldValue = changedValues[fieldName];
          setFormData((prev: ServiceFormData) => ({
            ...prev,
            [fieldName]: fieldValue
          }));
        }}
        className="form-responsive"
      >
        <Form.Item 
          label="Service Type" 
          name="serviceCategoryId"
          rules={[
            { 
              required: true, 
              message: 'Please select a service type' 
            }
          ]}
        >
          <Select
            showSearch
            placeholder="Select a service type"
            optionFilterProp="label"
            loading={categoriesLoading}
            notFoundContent={categoriesLoading ? 'Loading...' : 'No categories found'}
            options={serviceCategories.map(category => ({
              value: category.id,
              label: category.name
            }))}
            onChange={(value) => handleFieldChange('serviceCategoryId', value)}
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
      <div style={{ marginTop: 24, textAlign: 'right' }} className="flex-responsive">
        {current > 0 && (
          <Button className="btn-responsive" style={{ marginRight: 8 }} onClick={onPrev}>
            Previous
          </Button>
        )}
        {current < totalSteps - 1 && (
          <Button type="primary" className="btn-responsive" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceStepBasic;