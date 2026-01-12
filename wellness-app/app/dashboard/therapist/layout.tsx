'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { therapistApi } from '../../utils/apiUtils';
import { Spin } from 'antd';

export default function TherapistDashboardLayout({
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

      // Check if user has therapist role
      if (user.role?.toLowerCase() !== 'therapist') {
        // Redirect to appropriate dashboard based on role
        switch (user.role?.toLowerCase()) {
          case 'customer':
            router.push('/dashboard/customer');
            break;
          case 'business':
            router.push('/dashboard/business');
            break;
          default:
            router.push('/');
            break;
        }
        setAuthorized(false);
        return;
      }

      // Check if therapist profile exists
      try {
        const response = await therapistApi.getProfile();
        if (!response.success || !response.data) {
          // Profile doesn't exist, redirect to onboarding
          router.push('/onboarding/therapist');
          setAuthorized(false);
          return;
        }
      } catch (error) {
        // Profile doesn't exist, redirect to onboarding
        router.push('/onboarding/therapist');
        setAuthorized(false);
        return;
      }

      // User is authenticated, has therapist role, and has profile
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