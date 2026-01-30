'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  isHydrated: boolean;
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
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'roleSelection'>('roleSelection');

  // Initialize with a default loading state to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Check for stored authentication state on initial load
  useEffect(() => {
    // Set hydrated state first
    setIsHydrated(true);
    
    const initializeAuth = () => {
      setLoading(true);
      try {
        // Check for JWT token
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          // Verify token is still valid by attempting to parse it
          // In a real app, you'd verify the JWT signature
          const user = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUser(user);
          setRole(user.role || null);
        } else if (token) {
          // Token exists but no user data, clear the token
          localStorage.removeItem('token');
        }
      } catch (error) {
        // Invalid token or user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    setRole(userData?.role || null);
    // Token should already be stored in LoginModal
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', JSON.stringify(true));
      // Store role separately for easy access
      if (userData.role) {
        localStorage.setItem('role', userData.role);
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Clear JWT token
    localStorage.removeItem('role'); // Clear role
  };
  
  const loginWithRedirect = (userData: any) => {
    // Set auth state immediately for direct dashboard access
    login(userData);
    
    // Handle redirects based on user role immediately (no delays)
    if (typeof window !== 'undefined' && userData && userData.role) {
      const role = userData.role.toLowerCase();
      
      if (role === 'therapist') {
        // Direct redirect to therapist dashboard without profile checks
        window.location.href = '/dashboard/therapist';
      } else if (role === 'provider' || role === 'business') {
        // Direct redirect to provider dashboard without profile API calls
        window.location.href = '/dashboard/provider';
      } else if (role === 'customer') {
        window.location.href = '/dashboard/customer';
      } else {
        // Default redirect for other roles
        window.location.href = '/';
      }
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
    // Prevent opening auth modal if user is already authenticated
    if (isAuthenticated && !loading) {
      return;
    }
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
      role,
      loading,
      isHydrated,
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