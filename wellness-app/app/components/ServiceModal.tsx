'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { Modal, Steps, message, Spin } from 'antd';

// Lazy-loaded steps
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
  businessCountry?: string; // Country for currency formatting
}

const TOTAL_STEPS = 4;

const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading,
  editingService,
  businessCountry = 'USA',
}) => {
  const [current, setCurrent] = useState(0);
  const [approvedTherapists, setApprovedTherapists] = useState<any[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '',
    price: undefined,
    duration: undefined,
    description: '',
    images: [],
    teamMembers: [],
    therapists: [],
    isEditing: false,
  });

  /* ------------------ Initialize Modal Data ------------------ */
  useEffect(() => {
    if (!visible) return;

    setCurrent(0);
    setFormData({
      name: editingService?.name || '',
      price: editingService?.price,
      duration: editingService?.duration,
      description: editingService?.description || '',
      images: editingService?.images || [],
      teamMembers: editingService?.teamMembers || [],
      therapists: editingService?.therapists || [],
      isEditing: !!editingService,
    });

    fetchApprovedTherapists();
  }, [visible, editingService]);

  /* ------------------ Fetch Therapists ------------------ */
  const fetchApprovedTherapists = async () => {
    try {
      setLoadingTherapists(true);
      const token = localStorage.getItem('token');

      if (!token) throw new Error('Token missing');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/business/therapists`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setApprovedTherapists(result.data?.approvedTherapists || []);
    } catch (err: any) {
      message.error(err.message || 'Failed to load therapists');
    } finally {
      setLoadingTherapists(false);
    }
  };

  /* ------------------ Navigation Handlers ------------------ */
  const nextStep = useCallback(() => {
    setCurrent((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  }, []);

  /* ------------------ Submit ------------------ */
  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------ Step Renderer ------------------ */
  const renderStepContent = () => {
    const commonProps = {
      formData,
      setFormData,
      onNext: nextStep,
      onPrev: prevStep,
      current,
      totalSteps: TOTAL_STEPS,
    };

    switch (current) {
      case 0:
        return <ServiceStepBasic {...commonProps} businessCountry={businessCountry} />;

      case 1:
        return <ServiceStepMedia {...commonProps} />;

      case 2:
        return (
          <ServiceStepTeam
            {...commonProps}
            approvedTherapists={approvedTherapists}
            loadingTherapists={loadingTherapists}
          />
        );

      case 3:
        return (
          <ServiceStepReview
            formData={formData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
            isEditing={!!editingService}
          />
        );

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

  return (
    <Modal
      open={visible}
      title={editingService ? 'Edit Service' : 'Create New Service'}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnHidden={false}   // ⭐ keeps state alive
      maskClosable={false}
    >
      {/* Prevent accidental form submit */}
      <div onSubmit={(e) => e.preventDefault()}>
        <Steps current={current} items={steps} />

        <div className="mt-6 min-h-[350px]">
          <Suspense fallback={<Spin size="large" />}>
            {renderStepContent()}
          </Suspense>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceModal;
