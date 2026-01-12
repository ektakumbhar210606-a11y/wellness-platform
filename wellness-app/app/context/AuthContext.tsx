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
    // In a real app, you would check for tokens in localStorage/cookies
    // For now, we'll initialize to false
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth) {
      setIsAuthenticated(JSON.parse(storedAuth));
    }
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', JSON.stringify(true));
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };
  
  const loginWithRedirect = (userData: any) => {
    login(userData);
    
    // Check if user is a provider and needs onboarding
    if (userData.role && (userData.role.toLowerCase() === 'provider' || userData.role.toLowerCase() === 'business')) {
      // In a real app, you would use the router here
      // For now, we'll just update the user state
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // This would be handled by the component that calls this function
          // window.location.href = '/onboarding/provider';
        }
      }, 100);
    }
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