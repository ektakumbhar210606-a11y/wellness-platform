import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { therapistApi } from './apiUtils';

/**
 * Hook to protect therapist routes
 * Checks if user is authenticated and has therapist role
 * Redirects appropriately if not authorized
 */
export const useTherapistGuard = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const checkTherapistAccess = async (): Promise<boolean> => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/'); // Redirect to home page if not authenticated
      return false;
    }

    // Check if user has therapist role
    if (user.role?.toLowerCase() !== 'therapist') {
      // Redirect to appropriate dashboard based on role
      switch (user.role?.toLowerCase()) {
        case 'customer':
          router.push('/dashboard/customer');
          break;
        case 'business':
          router.push('/dashboard/business');
          break;
        default:
          router.push('/');
          break;
      }
      return false;
    }

    // Check if therapist profile exists
    try {
      const response = await therapistApi.getProfile();
      if (!response.success || !response.data) {
        // Profile doesn't exist, redirect to onboarding
        router.push('/onboarding/therapist');
        return false;
      }
    } catch (error) {
      // Profile doesn't exist, redirect to onboarding
      router.push('/onboarding/therapist');
      return false;
    }

    // User is authenticated, has therapist role, and has profile
    return true;
  };

  return { checkTherapistAccess };
};

/**
 * Function to check if onboarding is needed
 * @returns true if onboarding is needed, false otherwise
 */
export const checkOnboardingNeeded = async (): Promise<boolean> => {
  try {
    const response = await therapistApi.getProfile();
    // If profile exists, onboarding is not needed
    return !(response.success && response.data);
  } catch (error) {
    // If there's an error fetching profile, onboarding is needed
    return true;
  }
};