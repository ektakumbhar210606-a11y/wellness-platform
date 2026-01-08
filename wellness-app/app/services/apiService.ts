// apiService.ts - Example service using the useApi hook
import { useApi, useGet, usePost, usePut, useDelete } from '../hooks/useApi';

// Define types for our API responses
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Example usage functions that would typically be in a component
// These are here just to demonstrate the usage of the API hook

// Example: Get all users
export const useGetUsers = () => {
  return useGet<User[]>('/api/users');
};

// Example: Get user by ID
export const useGetUser = (id: number) => {
  return useGet<User>(`/api/users/${id}`);
};

// Example: Create a new user
export const useCreateUser = () => {
  return usePost<ApiResponse<User>>('/api/users');
};

// Example: Update a user
export const useUpdateUser = () => {
  return usePut<ApiResponse<User>>('/api/users');
};

// Example: Delete a user
export const useDeleteUser = (id: number) => {
  return useDelete<ApiResponse<User>>(`/api/users/${id}`);
};

// Example: Custom API call with the generic useApi hook
export const useCustomApiCall = (config: any) => {
  return useApi(config);
};

export default {
  useGetUsers,
  useGetUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useCustomApiCall
};