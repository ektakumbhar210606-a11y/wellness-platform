'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Table, Form, Input, InputNumber, Select, message, Space, Divider } from 'antd';
import { ShopOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Option } = Select;

const ProviderServicesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([
    { id: 1, name: 'Deep Tissue Massage', description: 'Relieves muscle tension and chronic pain', duration: 60, price: 80, category: 'Massage' },
    { id: 2, name: 'Aromatherapy', description: 'Essential oils for relaxation and healing', duration: 45, price: 70, category: 'Therapy' },
    { id: 3, name: 'Hot Stone Therapy', description: 'Heated stones for deep relaxation', duration: 75, price: 95, category: 'Therapy' },
  ]);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      router.push('/dashboard');
      return;
    }

    // Simulate loading services data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [isAuthenticated, user, router]);

  const columns = [
    {
      title: 'Service Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Duration (min)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Price ($)',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      duration: record.duration,
      price: record.price,
      category: record.category,
    });
  };

  const handleDelete = (id: number) => {
    setServices(services.filter(service => service.id !== id));
    message.success('Service deleted successfully!');
  };

  const onFinish = (values: any) => {
    if (editingId) {
      // Update existing service
      setServices(services.map(service => 
        service.id === editingId ? { ...service, ...values } : service
      ));
      message.success('Service updated successfully!');
    } else {
      // Add new service
      const newService = {
        id: services.length + 1,
        ...values,
      };
      setServices([...services, newService]);
      message.success('Service added successfully!');
    }
    
    form.resetFields();
    setEditingId(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <ShopOutlined /> Manage Services
        </Title>
        <Text>View, add, and manage your business services</Text>
      </div>

      <Card title="Add New Service" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Service Name"
            rules={[{ required: true, message: 'Please enter service name' }]}
          >
            <Input placeholder="Enter service name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter service description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter service description" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              <Option value="Massage">Massage</Option>
              <Option value="Therapy">Therapy</Option>
              <Option value="Skincare">Skincare</Option>
              <Option value="Wellness">Wellness</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration (minutes)"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber min={1} placeholder="Duration in minutes" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price ($)"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber min={0} placeholder="Price in dollars" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingId ? 'Update Service' : 'Add Service'}
              </Button>
              {editingId && (
                <Button onClick={() => {
                  form.resetFields();
                  setEditingId(null);
                }}>
                  Cancel
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Your Services">
        <Table 
          dataSource={services} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => router.back()}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default ProviderServicesPage;