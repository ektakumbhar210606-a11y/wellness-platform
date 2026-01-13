import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define the structure of the decoded JWT payload
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend the NextRequest type to include user information
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware function that verifies JWT tokens
 * @param req - The incoming Next.js request object
 * @param res - The Next.js response object
 * @returns NextResponse with 401 if unauthorized, or continues to next handler
 */
export function authenticate(req: AuthenticatedRequest): NextResponse | null {
  try {
    // Extract the authorization header
    const authHeader = req.headers.get('Authorization');

    // Check if authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access denied. No valid token provided.' },
        { status: 401 }
      );
    }

    // Extract the token from the header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token using the JWT secret
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError: any) {
      // Handle different types of JWT errors
      if (verificationError.name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Token has expired. Please log in again.' },
          { status: 401 }
        );
      } else if (verificationError.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Invalid token. Access denied.' },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: 'Authentication failed. Invalid token.' },
          { status: 401 }
        );
      }
    }

    // Attach the decoded user information to the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // Return null to indicate that authentication was successful and to continue
    return null;
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function that wraps API route handlers with authentication
 * @param handler - The API route handler function to wrap
 * @returns A new function that performs authentication before calling the handler
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Cast the request to our authenticated request type
    const authenticatedReq = req as AuthenticatedRequest;

    // Run the authentication middleware
    const authResult = authenticate(authenticatedReq);

    // If authentication failed, return the error response
    if (authResult) {
      return authResult;
    }

    // If authentication succeeded, call the original handler
    return handler(authenticatedReq);
  };
}

// Export default authentication function
export default authenticate;