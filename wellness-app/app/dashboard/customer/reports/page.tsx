'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CustomerReportPage = dynamic(() => import('./CustomerReportPage'), { ssr: false });

export default function CustomerReportsPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <CustomerReportPage />
    </Suspense>
  );
}
