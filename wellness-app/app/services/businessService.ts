// API helper functions
async function apiGet<T = any>(endpoint: string): Promise<T> {
  // Get the JWT token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    throw new Error('Authentication token not found. User is not logged in.');
  }

  // Get the base API URL from environment variables
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  }

  // Construct the full URL
  // For Next.js API routes, ensure the URL includes the /api prefix if not already present
  const url = `${baseUrl}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;

  try {
    // Make the GET request with authorization header
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Handle different HTTP status codes with meaningful error messages
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      // Map common HTTP status codes to meaningful messages
      switch (response.status) {
        case 400:
          errorMessage = 'Bad Request: The request was invalid';
          break;
        case 401:
          errorMessage = 'Unauthorized: Authentication required or failed';
          break;
        case 403:
          errorMessage = 'Forbidden: Access denied';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found';
          break;
        case 409:
          errorMessage = 'Conflict: The request could not be completed due to a conflict';
          break;
        case 422:
          errorMessage = 'Unprocessable Entity: The request was well-formed but unable to be followed';
          break;
        case 500:
          errorMessage = 'Internal Server Error: An unexpected error occurred on the server';
          break;
        case 502:
          errorMessage = 'Bad Gateway: The server received an invalid response from the upstream server';
          break;
        case 503:
          errorMessage = 'Service Unavailable: The server is temporarily unavailable';
          break;
        default:
          errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      }
      
      // Attempt to parse error response for more details
      let errorData;
      try {
        errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If response is not JSON, use the default error message
      }
      
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
    }
    
    // Parse and return the JSON response
    const responseData: T = await response.json();
    return responseData;
  } catch (error) {
    // Handle network errors or other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server');
    }
    
    if (error instanceof Error && 'status' in error) {
      throw error; // Re-throw HTTP errors with status
    }
    
    // For other errors, throw a generic error
    throw new Error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function apiPost<T = any, R = any>(endpoint: string, data: T): Promise<R> {
  // Get the JWT token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    throw new Error('Authentication token not found. User is not logged in.');
  }

  // Get the base API URL from environment variables
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  }

  // Construct the full URL
  // For Next.js API routes, ensure the URL includes the /api prefix if not already present
  const url = `${baseUrl}${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;

  try {
    // Make the POST request with authorization header
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different HTTP status codes with meaningful error messages
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      // Map common HTTP status codes to meaningful messages
      switch (response.status) {
        case 400:
          errorMessage = 'Bad Request: The request was invalid';
          break;
        case 401:
          errorMessage = 'Unauthorized: Authentication required or failed';
          break;
        case 403:
          errorMessage = 'Forbidden: Access denied';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found';
          break;
        case 409:
          errorMessage = 'Conflict: The request could not be completed due to a conflict';
          break;
        case 422:
          errorMessage = 'Unprocessable Entity: The request was well-formed but unable to be followed';
          break;
        case 500:
          errorMessage = 'Internal Server Error: An unexpected error occurred on the server';
          break;
        case 502:
          errorMessage = 'Bad Gateway: The server received an invalid response from the upstream server';
          break;
        case 503:
          errorMessage = 'Service Unavailable: The server is temporarily unavailable';
          break;
        default:
          errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      }
      
      // Attempt to parse error response for more details
      let errorData;
      try {
        errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If response is not JSON, use the default error message
      }
      
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    // Parse and return the JSON response
    const responseData: R = await response.json();
    return responseData;
  } catch (error) {
    // Handle network errors or other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server');
    }
    
    if (error instanceof Error && 'status' in error) {
      throw error; // Re-throw HTTP errors with status
    }
    
    // For other errors, throw a generic error
    throw new Error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface BusinessProfile {
  id?: string;
  business_name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  openingTime: string;
  closingTime: string;
  businessHours?: any;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BusinessCreationData {
  business_name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessHours?: {
    day: string;
    openingTime: string;
    closingTime: string;
  }[];
  status: 'active' | 'inactive';
}

export const businessService = {
  createBusiness: async (data: BusinessCreationData): Promise<BusinessProfile> => {
    return await apiPost('/businesses/create', data);
  },

  getBusinessProfile: async (): Promise<BusinessProfile> => {
    return await apiGet('/businesses/my-business');
  },

  checkOnboardingStatus: async (): Promise<{ completed: boolean; hasBusiness: boolean }> => {
    return await apiGet('/businesses/onboarding-status');
  },
};