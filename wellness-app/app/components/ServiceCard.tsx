import React from 'react';
import { Card, Typography, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Meta } = Card;
const { Text, Paragraph } = Typography;

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
    serviceCategory?: {
      id: string;
      name: string;
    } | null;
    image?: string;
    teamMembers?: any[];
    therapists?: any[];
  };
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
  deletingServiceId?: string | null;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete, deletingServiceId }) => {
  const handleEdit = () => {
    onEdit(service);
  };

  const handleDelete = () => {
    onDelete(service.id);
  };

  const isDeleting = deletingServiceId === service.id;

  return (
    <Card
      hoverable
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      cover={
        service.image ? (
          <img 
            alt={service.name} 
            src={service.image} 
            style={{ height: 160, objectFit: 'cover' }} 
          />
        ) : (
          <div 
            style={{ 
              height: 160, 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <span>No Image</span>
          </div>
        )
      }
      actions={[
        <Button 
          type="text" 
          icon={<EditOutlined />} 
          onClick={handleEdit}
        >
          Edit
        </Button>,
        <Popconfirm
          title="Delete the service"
          description="Are you sure you want to delete this service? This action cannot be undone."
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
          disabled={isDeleting}
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            loading={isDeleting}
          >
            Delete
          </Button>
        </Popconfirm>
      ]}
    >
      <div style={{ flexGrow: 1 }}>
        <Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong ellipsis={{ tooltip: service.name }}>{service.name}</Text>
              <Tag icon={<DollarOutlined />} color="green">
                ${service.price.toFixed(2)}
              </Tag>
            </div>
          }
          description={
            <div>
              {/* Service Category Display */}
              <div className="flex items-center mb-2">
                {service.serviceCategory ? (
                  <Tag color="blue" style={{ marginRight: 8 }}>
                    {service.serviceCategory.name}
                  </Tag>
                ) : (
                  <Tag color="default" style={{ marginRight: 8 }}>
                    No Category
                  </Tag>
                )}
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                <Text type="secondary">{service.duration} minutes</Text>
              </div>
              <Paragraph 
                ellipsis={{ rows: 2, expandable: false }} 
                style={{ marginBottom: 0 }}
              >
                {service.description}
              </Paragraph>
            </div>
          }
        />
        
        <div className="mt-3 pt-3 border-t">
          {service.teamMembers && service.teamMembers.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Team: {service.teamMembers.length} member{service.teamMembers.length !== 1 ? 's' : ''}
              </Text>
            </div>
          )}
          {service.therapists && service.therapists.length > 0 && (
            <div className="mt-1">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Therapists: {service.therapists.length} assigned
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;