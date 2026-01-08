import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

interface ApiConfig extends AxiosRequestConfig {
  method?: Method;
  url: string;
  data?: any;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  loading: boolean;
  status?: number;
}

const useApi = <T = any>(config?: ApiConfig): [
  (config: ApiConfig) => Promise<AxiosResponse<T>>,
  ApiResponse<T>,
  () => void
] => {
  const [response, setResponse] = useState<ApiResponse<T>>({
    loading: false,
  });

  const [requestConfig, setRequestConfig] = useState<ApiConfig | undefined>(config);

  const makeRequest = async (reqConfig: ApiConfig) => {
    setResponse({ loading: true });
    
    try {
      const axiosConfig: AxiosRequestConfig = {
        method: reqConfig.method || 'GET',
        data: reqConfig.data,
        headers: {
          'Content-Type': 'application/json',
          ...reqConfig.headers,
        },
        ...reqConfig,
        url: reqConfig.url, // Explicitly set url to avoid conflicts with spread operator
      };

      const result = await axios(axiosConfig);
      
      setResponse({
        data: result.data,
        loading: false,
        status: result.status,
      });

      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      const status = error.response?.status;

      setResponse({
        error: errorMessage,
        loading: false,
        status,
      });

      throw error;
    }
  };

  const reset = () => {
    setResponse({ loading: false });
  };

  // Execute the request if initial config is provided
  useEffect(() => {
    if (requestConfig) {
      makeRequest(requestConfig);
    }
  }, []);

  return [makeRequest, response, reset];
};

// Convenience hooks for specific HTTP methods
const useGet = <T = any>(url: string, initialConfig?: AxiosRequestConfig) => {
  const [request, response, reset] = useApi<T>({ ...initialConfig, method: 'GET', url });
  
  const wrappedRequest = (config?: AxiosRequestConfig) => {
    return request({ ...initialConfig, ...config, method: 'GET', url });
  };
  
  return [wrappedRequest, response, reset] as const;
};

const usePost = <T = any>(url: string, initialConfig?: AxiosRequestConfig) => {
  const [request, response, reset] = useApi<T>({ ...initialConfig, method: 'POST', url });
  
  const wrappedRequest = (data?: any, config?: AxiosRequestConfig) => {
    return request({ ...initialConfig, ...config, method: 'POST', url, data });
  };
  
  return [wrappedRequest, response, reset] as const;
};

const usePut = <T = any>(url: string, initialConfig?: AxiosRequestConfig) => {
  const [request, response, reset] = useApi<T>({ ...initialConfig, method: 'PUT', url });
  
  const wrappedRequest = (data?: any, config?: AxiosRequestConfig) => {
    return request({ ...initialConfig, ...config, method: 'PUT', url, data });
  };
  
  return [wrappedRequest, response, reset] as const;
};

const useDelete = <T = any>(url: string, initialConfig?: AxiosRequestConfig) => {
  const [request, response, reset] = useApi<T>({ ...initialConfig, method: 'DELETE', url });
  
  const wrappedRequest = (config?: AxiosRequestConfig) => {
    return request({ ...initialConfig, ...config, method: 'DELETE', url });
  };
  
  return [wrappedRequest, response, reset] as const;
};

export { useApi, useGet, usePost, usePut, useDelete };
export default useApi;