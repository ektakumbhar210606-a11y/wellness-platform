'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DynamicReportPage = dynamic(() => import('./BusinessReportPage'), { ssr: false });

export default function BusinessReportsPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <DynamicReportPage />
    </Suspense>
  );
}
