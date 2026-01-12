/**
 * Reusable API helper module for POST requests
 * Handles JSON serialization/deserialization and error handling
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status: number;
  };
}

/**
 * Makes a POST request to the specified API endpoint
 * @param endpoint - The API endpoint path (without base URL)
 * @param options - Request options including body and additional headers
 * @returns Promise resolving to the response data
 * @throws Error with meaningful message based on HTTP status code
 */
export async function postApi<T = any, R = any>(
  endpoint: string,
  options: {
    body?: T;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<R> {
  const { body, headers = {}, signal } = options;

  // Get the base API URL from environment variables
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in environment variables');
  }

  // Construct the full URL
  const url = `${baseUrl}${endpoint}`;

  try {
    // Make the POST request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
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

/**
 * Makes an authenticated POST request to the specified API endpoint
 * Automatically reads JWT token from localStorage and adds to Authorization header
 * @param endpoint - The API endpoint path (without base URL)
 * @param payload - The request body/data to send
 * @param additionalHeaders - Any additional headers to include
 * @returns Promise resolving to the response data
 * @throws Error with meaningful message based on HTTP status code
 */
export async function apiPostAuth<T = any, R = any>(
  endpoint: string,
  payload?: T,
  additionalHeaders?: Record<string, string>
): Promise<R> {
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
  const url = `${baseUrl}${endpoint}`;
  
  try {
    // Make the POST request with authorization header
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...additionalHeaders,
      },
      body: payload ? JSON.stringify(payload) : undefined,
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