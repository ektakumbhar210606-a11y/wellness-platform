import { useAuth } from '../context/AuthContext';

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token'); // assuming token is stored as 'token'
    return token ? `Bearer ${token}` : null;
  }
  return null;
};

// Helper function to make authenticated API calls
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function specifically for customer API calls
export const customerApi = {
  // Get customer profile
  getProfile: async () => {
    return makeAuthenticatedRequest('/api/users/me');
  },

  // Check if customer has completed onboarding
  hasCompletedOnboarding: async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/users/me');
      // For now, we'll consider onboarding complete if they have basic profile info
      // In a real implementation, you might have a dedicated endpoint or field
      return response && response.name && response.email;
    } catch (error) {
      console.error('Error checking customer onboarding status:', error);
      return false;
    }
  },
};

// Helper function specifically for therapist API calls
export const therapistApi = {
  // Get therapist profile
  getProfile: async () => {
    return makeAuthenticatedRequest('/api/therapist/me');
  },

  // Create therapist profile
  createProfile: async (profileData: any) => {
    return makeAuthenticatedRequest('/api/therapist/create', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  // Update therapist profile
  updateProfile: async (profileData: any) => {
    return makeAuthenticatedRequest('/api/therapist/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};