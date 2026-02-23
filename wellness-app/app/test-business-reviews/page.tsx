'use client';

import React from 'react';
import BusinessReviews from '../components/BusinessReviews';

const TestBusinessReviews = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Business Reviews Test Page</h1>
      <p>This page directly renders the BusinessReviews component to test if it works.</p>
      <BusinessReviews />
    </div>
  );
};

export default TestBusinessReviews;