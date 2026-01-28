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
    // Handle non-JSON responses (like HTML error pages)
    const contentType = response.headers.get('content-type');
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, use the default error message
      }
    }
    
    throw new Error(errorMessage);
  }

  // Check if response is JSON before parsing
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    // If not JSON, return text or handle appropriately
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType || 'unknown type'}`);
  }
};

// Helper function specifically for customer API calls
export const customerApi = {
  // Get customer profile
  getProfile: async () => {
    return makeAuthenticatedRequest('/api/customers');
  },

  // Check if customer has completed onboarding
  hasCompletedOnboarding: async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return false;
      }
      
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });
      
      // If profile doesn't exist (404), onboarding is not completed
      if (response.status === 404) {
        return false;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Check if customer profile exists and onboarding is completed
      return data && data.data && data.data.onboardingCompleted === true;
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

  // Get therapist dashboard data
  getDashboardData: async () => {
    return makeAuthenticatedRequest('/api/therapist/dashboard');
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