'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export const useAuthProtection = (options: {
  redirectToDashboard?: boolean;
  allowedRoles?: string[];
  redirectPath?: string;
} = {}) => {
  const { redirectToDashboard = false, allowedRoles = [], redirectPath } = options;
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  const checkAccess = () => {
    if (loading) return false;

    // Redirect authenticated therapists/providers to dashboards
    if (redirectToDashboard && isAuthenticated && role) {
      const normalizedRole = role.toLowerCase();
      
      if (normalizedRole === 'therapist') {
        router.replace('/dashboard/therapist');
        return false;
      } else if (normalizedRole === 'provider' || normalizedRole === 'business') {
        router.replace('/dashboard/provider');
        return false;
      }
      return true;
    }

    // Check role-based access
    if (allowedRoles.length > 0) {
      if (!isAuthenticated) {
        return false;
      }
      
      if (role) {
        const normalizedRole = role.toLowerCase();
        const hasAccess = allowedRoles.some(allowedRole => 
          allowedRole.toLowerCase() === normalizedRole
        );
        
        if (!hasAccess) {
          if (normalizedRole === 'therapist') {
            router.replace('/dashboard/therapist');
          } else if (normalizedRole === 'provider' || normalizedRole === 'business') {
            router.replace('/dashboard/provider');
          } else if (normalizedRole === 'customer') {
            router.replace('/dashboard/customer');
          } else {
            router.replace(redirectPath || '/');
          }
          return false;
        }
      }
    } else {
      // Public access but redirect authenticated business users
      if (isAuthenticated && role) {
        const normalizedRole = role.toLowerCase();
        if (normalizedRole === 'therapist' || normalizedRole === 'provider' || normalizedRole === 'business') {
          if (normalizedRole === 'therapist') {
            router.replace('/dashboard/therapist');
          } else {
            router.replace('/dashboard/provider');
          }
          return false;
        }
      }
    }

    return true;
  };

  return {
    loading,
    hasAccess: checkAccess(),
    isAuthenticated,
    userRole: role
  };
};