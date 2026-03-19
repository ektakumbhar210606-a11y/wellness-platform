'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DynamicTherapistReportPage = dynamic(() => import('./TherapistReportPage'), { ssr: false });

export default function TherapistReportsPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <DynamicTherapistReportPage />
    </Suspense>
  );
}
