import { NextRequest, NextResponse } from 'next/server';

/**
 * GET endpoint to retrieve the current user's business
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

    // Import jsonwebtoken dynamically and verify the token using the JWT secret
    const jwt = (await import('jsonwebtoken')).default;

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
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

    // Extract user information from the decoded token
    const userId = decoded.id;

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import Business model
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Find the business owned by this user
    const business = await Business.findOne({ owner: userId });

    if (!business) {
      return NextResponse.json(
        { error: 'No business found for this user' },
        { status: 404 }
      );
    }

    // Return the business document (excluding sensitive information)
    return NextResponse.json({
      id: business._id,
      business_name: business.name,
      description: business.description,
      address: business.address,
      openingTime: business.openingTime,
      closingTime: business.closingTime,
      businessHours: business.businessHours,
      status: business.status,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    });
  } catch (error: any) {
    console.error('Error fetching business:', error);

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}