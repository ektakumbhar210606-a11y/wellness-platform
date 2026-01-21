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
  // Modal state management
  authModalOpen: boolean;
  authModalView: 'login' | 'register' | 'roleSelection';
  openAuthModal: (view?: 'login' | 'register' | 'roleSelection') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'roleSelection'>('roleSelection');

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

  // Modal state management functions
  const openAuthModal = (view: 'login' | 'register' | 'roleSelection' = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    // Reset to default/clean state when closing
    setAuthModalView('roleSelection'); // Default to role selection for fresh start
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      loginWithRedirect,
      logout, 
      user,
      isOnboardingComplete: checkOnboardingStatus(),
      checkOnboardingStatus,
      // Modal state
      authModalOpen,
      authModalView,
      openAuthModal,
      closeAuthModal
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