'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import ProviderOnboarding from '@/app/components/ProviderOnboarding';

const ProviderOnboardingPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();

  // Check if user is authenticated and is a provider
  React.useEffect(() => {
    if (!isAuthenticated) {
      message.error('Please log in to continue');
      router.push('/'); // Redirect to home if not authenticated
      return;
    }
    
    // If user is not a provider, redirect to appropriate dashboard
    if (user && user.role && user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business') {
      if (user.role.toLowerCase() === 'customer') {
        router.push('/dashboard/customer');
      } else if (user.role.toLowerCase() === 'therapist') {
        router.push('/dashboard/therapist');
      } else {
        router.push('/');
      }
      return;
    }
    
    // If user is a provider and has already completed onboarding, redirect to dashboard
    if (user && user.role && (user.role.toLowerCase() === 'provider' || user.role.toLowerCase() === 'business')) {
      // In a real app, you would check if onboarding is complete
      // For now, we'll allow the onboarding to proceed
    }
  }, [isAuthenticated, user, router]);

  const handleComplete = async (formData: any) => {
    try {
      message.success('Business profile created successfully!');
      
      // Update user data in context if needed
      if (user) {
        const updatedUser = {
          ...user,
          onboardingComplete: true,
          businessId: formData.id || formData._id, // Using the ID from the API response
        };
        
        // Update user in localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update the auth context with the updated user
        login(updatedUser);
      }
      
      // Redirect to dashboard
      router.push('/dashboard/provider');
      
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      message.error(error.message || 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        padding: '20px'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '10px'
        }}>
          Welcome, Provider!
        </h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Complete your profile to start serving clients
        </p>
      </div>
      
      <ProviderOnboarding onComplete={handleComplete} />
    </div>
  );
};

export default ProviderOnboardingPage;