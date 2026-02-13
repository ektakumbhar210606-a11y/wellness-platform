import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

/**
 * GET endpoint to check if the current user has completed business onboarding
 * Returns true if business profile exists, false otherwise
 * Protected by authentication
 */
export async function GET(request: NextRequest) {
  try {
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

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (verificationError: unknown) {
      // Handle different types of JWT errors
      if (verificationError instanceof Error) {
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
        }
      }
      return NextResponse.json(
        { error: 'Authentication failed. Invalid token.' },
        { status: 401 }
      );
    }

    // Extract user information from the decoded token
    const userId = (decoded as JwtPayload).id;

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import Business model
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Check if a business exists for this user
    const business = await Business.findOne({ owner: userId });

    // Return onboarding status
    return NextResponse.json({
      completed: !!business,
      hasBusiness: !!business
    });
  } catch (error: unknown) {
    console.error('Error checking onboarding status:', error);

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
