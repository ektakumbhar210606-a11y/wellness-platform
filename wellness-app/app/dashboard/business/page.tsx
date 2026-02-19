'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BusinessDashboardPage = () => {
  const router = useRouter();

  // Redirect business dashboard to provider dashboard since they share the same layout
  useEffect(() => {
    router.replace('/dashboard/provider');
  }, [router]);

  return null; // Return null since we're redirecting
};

export default BusinessDashboardPage;