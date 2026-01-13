import { NextRequest, NextResponse } from 'next/server';

// Using dynamic imports to handle module resolution issues
const dbModule = await import('@/lib/db');
const connectToDatabase = dbModule.connectToDatabase;

const userModule = await import('@/models/User');
const User = userModule.default;

// Define the structure of the decoded JWT payload
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * GET endpoint to retrieve the authenticated user's profile
 * Protected by authentication middleware
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Extract the authorization header
    const authHeader = request.headers.get('Authorization');

    // Check if authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access denied. No valid token provided.' },
        { status: 401 }
      );
    }

    // Extract the token from the header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Import jsonwebtoken dynamically and verify the token using the JWT secret
    const jwt = (await import('jsonwebtoken')).default;

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

    // Extract userId from the decoded token
    const userId = decoded.id;

    // Query the database for the user document by userId
    const user = await User.findById(userId).select('-password'); // Exclude password field

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data
    return NextResponse.json(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    
    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
      // Invalid user ID format
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}