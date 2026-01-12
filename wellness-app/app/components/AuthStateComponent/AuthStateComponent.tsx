'use client';

import React, { useState, useEffect } from 'react';

interface AuthStateComponentProps {
  onSignInClick?: () => void; // Optional callback when sign in is clicked
  onLogoutComplete?: () => void; // Optional callback when logout is completed
  signInText?: string; // Custom text for sign in button
  logoutText?: string; // Custom text for logout button
  className?: string; // Optional CSS class for styling
}

const AuthStateComponent: React.FC<AuthStateComponentProps> = ({
  onSignInClick,
  onLogoutComplete,
  signInText = 'Sign In',
  logoutText = 'Logout',
  className = ''
}) => {
  // State to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Check authentication status on initial render and when component mounts
   * Looks for JWT token in localStorage and sets state accordingly
   */
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        // Check for JWT token presence in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // Set isAuthenticated state to true if token exists, false otherwise
        setIsAuthenticated(!!token);
      } catch (error) {
        // Handle potential errors gracefully (e.g., localStorage not available)
        console.warn('Unable to access localStorage:', error);
        setIsAuthenticated(false);
      }
    };

    // Run the check when component mounts
    checkAuthStatus();

    // Listen for storage events to update auth state across tabs
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Logout handler function that:
   * - Removes the JWT token from localStorage (key: 'token')
   * - Removes user role from localStorage (key: 'role')
   * - Updates isAuthenticated state to false immediately
   * - Optionally clear any user data from localStorage
   */
  const handleLogout = () => {
    try {
      // Remove the JWT token from localStorage
      localStorage.removeItem('token');
      
      // Remove user role from localStorage
      localStorage.removeItem('role');
      
      // Optionally clear other user data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAuthenticated');
      
      // Update isAuthenticated state to false immediately
      setIsAuthenticated(false);
      
      // Call the optional callback when logout is completed
      if (onLogoutComplete) {
        onLogoutComplete();
      }
    } catch (error) {
      // Handle potential errors gracefully
      console.warn('Error during logout:', error);
    }
  };

  /**
   * Handler for sign in action
   * Calls the optional callback when sign in is clicked
   */
  const handleSignIn = () => {
    if (onSignInClick) {
      onSignInClick();
    }
  };

  return (
    <div className={className}>
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="auth-state-logout-btn"
        >
          {logoutText}
        </button>
      ) : (
        <button
          onClick={handleSignIn}
          aria-label="Sign In"
          className="auth-state-signin-btn"
        >
          {signInText}
        </button>
      )}
    </div>
  );
};

export default AuthStateComponent;