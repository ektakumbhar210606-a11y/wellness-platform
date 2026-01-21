'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the client component with no SSR
const DynamicProviderDashboardContent = dynamic(() => import('./ProviderDashboardContent'), { ssr: false });

export default function ProviderDashboard() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DynamicProviderDashboardContent />
    </Suspense>
  );
}