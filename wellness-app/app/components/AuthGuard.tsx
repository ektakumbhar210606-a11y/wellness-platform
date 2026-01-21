'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectToDashboard?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  allowedRoles = [],
  redirectToDashboard = false 
}) => {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading authentication state
    if (loading) return;

    // If we want to redirect authenticated therapists/providers to their dashboards
    if (redirectToDashboard && isAuthenticated && role) {
      const normalizedRole = role.toLowerCase();
      
      if (normalizedRole === 'therapist') {
        router.replace('/dashboard/therapist');
        return;
      } else if (normalizedRole === 'provider' || normalizedRole === 'business') {
        router.replace('/dashboard/provider');
        return;
      }
    }

    // If specific roles are required and user doesn't have access
    if (allowedRoles.length > 0 && isAuthenticated && role) {
      const normalizedRole = role.toLowerCase();
      const hasAccess = allowedRoles.some(allowedRole => 
        allowedRole.toLowerCase() === normalizedRole
      );
      
      if (!hasAccess) {
        // Redirect to appropriate dashboard based on role
        if (normalizedRole === 'therapist') {
          router.replace('/dashboard/therapist');
        } else if (normalizedRole === 'provider' || normalizedRole === 'business') {
          router.replace('/dashboard/provider');
        } else if (normalizedRole === 'customer') {
          router.replace('/dashboard/customer');
        } else {
          router.replace('/');
        }
      }
    }
  }, [isAuthenticated, role, loading, router, allowedRoles, redirectToDashboard]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;