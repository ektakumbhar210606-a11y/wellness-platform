'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userData: any) => void;
  loginWithRedirect: (userData: any) => void;
  logout: () => void;
  user: any;
  isOnboardingComplete: boolean;
  checkOnboardingStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  // Check for stored authentication state on initial load
  useEffect(() => {
    // Check for JWT token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Verify token is still valid by attempting to parse it
        // In a real app, you'd verify the JWT signature
        const user = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(user);
      } catch (error) {
        // Invalid token or user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    } else if (token) {
      // Token exists but no user data, clear the token
      localStorage.removeItem('token');
    }
  }, []);

  const login = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    // Token is already stored in LoginModal
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', JSON.stringify(true));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Clear JWT token
  };
  
  const loginWithRedirect = (userData: any) => {
    login(userData);
    
    // Handle redirects based on user role after a brief delay
    setTimeout(() => {
      if (typeof window !== 'undefined' && userData && userData.role) {
        const role = userData.role.toLowerCase();
        
        if (role === 'therapist') {
          // For therapists, check if profile exists and redirect accordingly
          // This would typically involve an API call to check therapist profile
          // For now, we'll redirect to therapist dashboard
          window.location.href = '/dashboard/therapist';
        } else if (role === 'provider' || role === 'business') {
          // Check if provider/business needs onboarding
          const hasProfile = userData.providerProfileId || userData.businessId || userData.onboardingComplete === true;
          if (!hasProfile) {
            window.location.href = '/onboarding/provider';
          } else {
            window.location.href = '/dashboard/provider';
          }
        } else if (role === 'customer') {
          window.location.href = '/dashboard/customer';
        } else {
          // Default redirect for other roles
          window.location.href = '/';
        }
      }
    }, 100);
  };
  
  const checkOnboardingStatus = (): boolean => {
    // In a real application, this would check if the user has completed onboarding
    // by checking for a specific property in user data or making an API call
    // For now, we'll return true if user exists and has a provider profile
    if (user && user.role && (user.role.toLowerCase() === 'provider' || user.role.toLowerCase() === 'business')) {
      // Check if provider profile exists
      return !!user.providerProfileId || !!user.businessId || user.onboardingComplete === true;
    }
    return true; // Non-providers don't need onboarding
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      loginWithRedirect,
      logout, 
      user,
      isOnboardingComplete: checkOnboardingStatus(),
      checkOnboardingStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};