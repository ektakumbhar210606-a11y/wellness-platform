'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useAuth } from '@/app/context/AuthContext';
import { businessService } from '@/app/services/businessService';
import ProviderOnboarding from '@/app/components/ProviderOnboarding';

const ProviderOnboardingPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Check if user is authenticated and is a provider
  useEffect(() => {
    const checkOnboardingStatus = async () => {
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
      
      try {
        // Check if onboarding is already completed
        const onboardingStatus = await businessService.checkOnboardingStatus();
        
        if (onboardingStatus.completed) {
          // If onboarding is already completed, redirect to dashboard
          message.info('Onboarding already completed. Redirecting to dashboard...');
          router.push('/dashboard/provider');
          return;
        }
      } catch (error: any) {
        console.error('Error checking onboarding status:', error);
        // If there's an error checking status, continue with onboarding
      }
      
      // Set user data for auto-fill
      if (user) {
        setUserData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
      
      setLoading(false);
    };
    
    checkOnboardingStatus();
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
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
      
      <ProviderOnboarding onComplete={handleComplete} userData={userData} />
    </div>
  );
};

export default ProviderOnboardingPage;