'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Space, message } from 'antd';

// Dynamically import step components to avoid circular dependencies during build
const ServiceStepBasic = React.lazy(() => import('./ServiceStepBasic'));
const ServiceStepMedia = React.lazy(() => import('./ServiceStepMedia'));
const ServiceStepTeam = React.lazy(() => import('./ServiceStepTeam'));
const ServiceStepReview = React.lazy(() => import('./ServiceStepReview'));

interface ServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  loading: boolean;
  editingService?: any;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ 
  visible, 
  onClose, 
  onSubmit,
  loading,
  editingService
}) => {
  const [current, setCurrent] = useState(0);
  const [approvedTherapists, setApprovedTherapists] = useState<any[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  
  // Initialize form data based on whether we're editing or creating
  const [formData, setFormData] = useState({
    name: editingService ? editingService.name : '',
    price: editingService ? editingService.price : undefined,
    duration: editingService ? editingService.duration : undefined,
    description: editingService ? editingService.description : '',
    images: editingService ? editingService.images || [] : [],
<<<<<<< HEAD
=======
    teamMembers: editingService ? editingService.teamMembers || [] : [],
>>>>>>> 6f4583a58e916cd58870586ef9a22dc9a9e57a53
    therapists: editingService ? editingService.therapists || [] : [],
    isEditing: !!editingService
  });
  
  // Fetch approved therapists when modal opens
  useEffect(() => {
    if (visible) {
      fetchApprovedTherapists();
      setFormData({
        name: editingService ? editingService.name : '',
        price: editingService ? editingService.price : undefined,
        duration: editingService ? editingService.duration : undefined,
        description: editingService ? editingService.description : '',
        images: editingService ? editingService.images || [] : [],
<<<<<<< HEAD
=======
        teamMembers: editingService ? editingService.teamMembers || [] : [],
>>>>>>> 6f4583a58e916cd58870586ef9a22dc9a9e57a53
        therapists: editingService ? editingService.therapists || [] : [],
        isEditing: !!editingService
      });
      setCurrent(0); // Reset to first step
    }
  }, [visible, editingService]);

  const fetchApprovedTherapists = async () => {
    try {
      setLoadingTherapists(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/therapists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch approved therapists');
      }
      
      setApprovedTherapists(result.data?.approvedTherapists || []);
    } catch (error: any) {
      console.error('Error fetching approved therapists:', error);
      message.error(error.message || 'Failed to load approved therapists');
      setApprovedTherapists([]);
    } finally {
      setLoadingTherapists(false);
    }
  };

  // Dynamically render components to avoid import issues
  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return <ServiceStepBasic formData={formData} setFormData={setFormData} />;
      case 1:
        return <ServiceStepMedia formData={formData} setFormData={setFormData} />;
      case 2:
        return (
          <ServiceStepTeam 
            formData={formData} 
            setFormData={setFormData}
            approvedTherapists={approvedTherapists}
            loadingTherapists={loadingTherapists}
          />
        );
      case 3:
        return <ServiceStepReview formData={formData} />;
      default:
        return null;
    }
  };

  const steps = [
    { title: 'Basic Details' },
    { title: 'Media Upload' },
    { title: 'Team Members' },
    { title: 'Review & Submit' },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting service:', error);
    }
  };

  const isStepValid = () => {
    switch (current) {
      case 0: // Basic Details
        return formData.name.trim() !== '' && 
               formData.price !== undefined && 
               formData.duration !== undefined && 
               formData.description.trim() !== '';
      case 1: // Media Upload
        return true; // Optional step
      case 2: // Team Members
        return true; // Optional step
      case 3: // Review & Submit
        return true; // Always valid
      default:
        return false;
    }
  };

  return (
    <Modal
      title={editingService ? "Edit Service" : "Create New Service"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
    >
      <Steps current={current} items={steps} />
      
      <div className="mt-6">
        {renderStepContent(current)}
      </div>
      
      <div className="mt-8 flex justify-between">
        <Space>
          <Button disabled={current === 0} onClick={() => prev()}>
            Previous
          </Button>
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()} disabled={!isStepValid()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={loading}
              disabled={!isStepValid()}
            >
              {editingService ? "Update Service" : "Create Service"}
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default ServiceModal;