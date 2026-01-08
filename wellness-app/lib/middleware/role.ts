import { NextRequest, NextResponse } from 'next/server';
import { AuthenticatedRequest } from './auth'; // Import the authenticated request interface from our auth middleware
import { UserRole } from '../../models/User'; // Import the UserRole enum from the User model

/**
 * Role-based authorization middleware function
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns A middleware function that checks user role against allowed roles
 */
export function authorize(allowedRoles: UserRole[]) {
  return function (req: AuthenticatedRequest): NextResponse | null {
    try {
      // Check if user information exists in the request (should be attached by auth middleware)
      if (!req.user) {
        return NextResponse.json(
          { error: 'Access denied. User not authenticated.' },
          { status: 401 }
        );
      }

      // Get the user's role from the request object
      const userRole = req.user.role;

      // Check if the user's role is included in the allowed roles array
      const hasPermission = allowedRoles.some(allowedRole => allowedRole === userRole);

      if (!hasPermission) {
        return NextResponse.json(
          { 
            error: `Access denied. Insufficient permissions. Allowed roles: ${allowedRoles.join(', ')}. Your role: ${userRole}.` 
          },
          { status: 403 }
        );
      }

      // User has the required role, allow access
      return null;
    } catch (error: any) {
      console.error('Role authorization middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error during role authorization.' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function that wraps API route handlers with role-based authorization
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param handler - The API route handler function to wrap
 * @returns A new function that performs role authorization before calling the handler
 */
export function withRoleAuth(allowedRoles: UserRole[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Cast the request to our authenticated request type
    const authenticatedReq = req as AuthenticatedRequest;

    // Run the role authorization middleware
    const authResult = authorize(allowedRoles)(authenticatedReq);

    // If authorization failed, return the error response
    if (authResult) {
      return authResult;
    }

    // If authorization succeeded, call the original handler
    return handler(authenticatedReq);
  };
}

/**
 * Convenience function for admin-only access
 */
export function adminOnly(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRoleAuth([UserRole.Business], handler);
}

/**
 * Convenience function for therapist access
 */
export function therapistOnly(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRoleAuth([UserRole.Therapist], handler);
}

/**
 * Convenience function for customer access
 */
export function customerOnly(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRoleAuth([UserRole.Customer], handler);
}

/**
 * Convenience function for multiple role access
 */
export function multiRole(roles: UserRole[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRoleAuth(roles, handler);
}

// Export default function
export default authorize;