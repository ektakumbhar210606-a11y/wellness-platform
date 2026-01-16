'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Spin } from 'antd';

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push('/'); // Redirect to home page if not authenticated
        setAuthorized(false);
        return;
      }

      // Check if user has customer role
      if (user.role?.toLowerCase() !== 'customer') {
        // Redirect to appropriate dashboard based on role
        switch (user.role?.toLowerCase()) {
          case 'therapist':
            router.push('/dashboard/therapist');
            break;
          case 'provider':
          case 'business':
            router.push('/dashboard/provider');
            break;
          default:
            router.push('/');
            break;
        }
        setAuthorized(false);
        return;
      }

      // In a real app, you would check if customer profile exists
      // If it doesn't, redirect to onboarding
      // For now, we'll assume they have completed onboarding
      // const response = await customerApi.getProfile();
      // if (!response.success || !response.data) {
      //   // Profile doesn't exist, redirect to onboarding
      //   router.push('/onboarding/customer');
      //   setAuthorized(false);
      //   return;
      // }

      // User is authenticated, has customer role, and has profile
      setAuthorized(true);
    };

    checkAuthorization();
  }, [user, isAuthenticated, router]);

  if (authorized === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (authorized === false) {
    return null; // Redirect will happen, so return nothing
  }

  return <>{children}</>;
}