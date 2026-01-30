'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DynamicCustomerDashboardContent = dynamic(() => import('./CustomerDashboardContent'), { ssr: false });

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DynamicCustomerDashboardContent />
    </Suspense>
  );
}