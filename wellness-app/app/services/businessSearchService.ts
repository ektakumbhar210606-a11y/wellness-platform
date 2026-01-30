import { IBusiness as BusinessInterface } from '../../models/Business';
export type { BusinessInterface as IBusiness };

export interface BusinessSearchParams {
  search?: string;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  serviceType?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interface for business data returned by search API (with calculated fields)
export interface ISearchedBusiness {
  _id: string;
  name: string;
  description?: string;
  serviceType?: string;
  serviceName?: string;
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
  status: string;
  createdAt: Date;
  avgRating?: number;
}

export interface BusinessSearchResponse {
  success: boolean;
  message: string;
  data: {
    businesses: ISearchedBusiness[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    filters: {
      locations: string[];
      serviceTypes: string[];
    };
  };
}

/**
 * Fetch businesses with search and filtering capabilities
 */
export const searchBusinesses = async (
  params: BusinessSearchParams = {}
): Promise<BusinessSearchResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.location) queryParams.append('location', params.location);
    if (params.country) queryParams.append('country', params.country);
    if (params.state) queryParams.append('state', params.state);
    if (params.city) queryParams.append('city', params.city);
    if (params.serviceType) queryParams.append('serviceType', params.serviceType);
    if (params.minRating !== undefined) queryParams.append('minRating', params.minRating.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/search?${queryParams}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching businesses:', error);
    throw error;
  }
};

/**
 * Fetch all available filter options
 * @param params Optional parameters to filter the results
 */
export const getFilterOptions = async (params: { country?: string } = {}): Promise<{
  locations: string[];
  countries: string[];
  states: string[];
  cities: string[];
  serviceTypes: string[];
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.country) {
      queryParams.append('country', params.country);
    }
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/search?${queryString}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/search`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.filters;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

/**
 * Check if customer has completed onboarding
 */
export const checkCustomerOnboardingStatus = async (): Promise<{
  onboardingCompleted: boolean;
  message: string;
}> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/check-onboarding`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      onboardingCompleted: data.onboardingCompleted,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking customer onboarding status:', error);
    throw error;
  }
};