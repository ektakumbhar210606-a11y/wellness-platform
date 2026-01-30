'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

const CustomerRedirectHandler = () => {
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/'); // Redirect to home if no token
          return;
        }

        const response = await fetch('/api/customers/check-onboarding', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check onboarding status');
        }

        const result = await response.json();

        if (!result.onboardingCompleted) {
          // If onboarding is not completed, redirect to onboarding
          router.push('/onboarding/customer');
        } else {
          // If onboarding is completed, stay on current page (dashboard)
          // The dashboard component will handle displaying content
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.push('/'); // Redirect to home on error
      }
    };

    checkOnboardingStatus();
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  );
};

export default CustomerRedirectHandler;