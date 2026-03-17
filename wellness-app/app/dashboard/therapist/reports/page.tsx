'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DynamicReportPage = dynamic(() => import('../../../components/ReportPage'), { ssr: false });

export default function TherapistReportsPage() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <DynamicReportPage role="therapist" />
    </Suspense>
  );
}
