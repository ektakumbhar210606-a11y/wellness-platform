'use client';

import React, { useState } from 'react';
import { 
  Modal, 
  Rate, 
  Input, 
  Button, 
  message,
  Space,
  Typography
} from 'antd';
import { StarOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ReviewModalProps {
  visible: boolean;
  bookingId?: string;
  serviceName?: string;
  therapistName?: string;
  bookingDate?: string;
  bookingTime?: string;
  onCancel: () => void;
  onSuccess?: (reviewData: { rating: number; comment: string }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  bookingId,
  serviceName,
  therapistName,
  bookingDate,
  bookingTime,
  onCancel,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      setErrors({});
      setSubmitting(false);
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Rating is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!bookingId) {
      message.error('Booking information is missing');
      return;
    }

    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required. Please log in.');
        return;
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const result = await response.json();
      
      // Show success message
      message.success('Review submitted successfully! +5 reward points earned');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ rating, comment });
      }
      
      // Close modal
      handleCancel();

    } catch (error: any) {
      console.error('Error submitting review:', error);
      message.error(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Only close if not submitting
    if (!submitting) {
      setRating(0);
      setComment('');
      setErrors({});
      onCancel();
    }
  };

  const handleRatingChange = (value: number) => {
    setRating(value);
    // Clear rating error when user selects a rating
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  return (
    <Modal
      title={
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>Write a Review</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      ]}
      width={500}
      maskClosable={!submitting}
      keyboard={!submitting}
      destroyOnHidden
    >
      {/* Booking Information Display */}
      {(serviceName || therapistName || bookingDate) && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '8px' 
        }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: '12px' }}>
            Booking Details
          </Title>
          {serviceName && (
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              {serviceName}
            </Text>
          )}
          {therapistName && (
            <div style={{ marginBottom: '4px' }}>
              <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <Text>{therapistName}</Text>
            </div>
          )}
          {bookingDate && bookingTime && (
            <div>
              <CalendarOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
              <Text>
                {new Date(bookingDate).toLocaleDateString()} at {bookingTime}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Rating Section */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 500,
          color: errors.rating ? '#ff4d4f' : 'inherit'
        }}>
          Rating <span style={{ color: '#ff4d4f' }}>*</span>
          {errors.rating && (
            <Text type="danger" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
              {errors.rating}
            </Text>
          )}
        </label>
        <Rate 
          value={rating} 
          onChange={handleRatingChange}
          style={{ fontSize: '28px' }}
          disabled={submitting}
        />
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
          {rating === 0 && 'Select a rating'}
        </div>
      </div>

      {/* Comment Section */}
      <div>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 500 
        }}>
          Comment (Optional)
        </label>
        <TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this service..."
          rows={4}
          maxLength={1000}
          showCount
          disabled={submitting}
          style={{ resize: 'vertical' }}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
          Maximum 1000 characters
        </Text>
      </div>

      {/* Submission Status */}
      {submitting && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#e6f7ff', 
          borderRadius: '4px',
          border: '1px solid #91d5ff'
        }}>
          <Text type="secondary">
            Submitting your review and updating your reward points...
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default ReviewModal;