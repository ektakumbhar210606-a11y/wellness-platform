'use client';

import React from 'react';
import { Typography } from 'antd';
import TherapistReviews from '../../../components/TherapistReviews';

const { Title } = Typography;

const TherapistReviewsPage = () => {
  return (
    <>
      <Title level={2} style={{ marginBottom: '24px', color: '#1d3557' }}>
        My Reviews
      </Title>
      <TherapistReviews />
    </>
  );
};

export default TherapistReviewsPage;