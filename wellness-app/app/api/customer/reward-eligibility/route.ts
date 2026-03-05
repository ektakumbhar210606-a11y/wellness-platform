import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

/**
 * GET endpoint to check customer's reward discount eligibility
 * Returns reward points and whether 10% discount is available
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

    // Verify the token
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (verificationError: unknown) {
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
    const userId = (decoded as jwt.JwtPayload).id;
    const userRole = (decoded as jwt.JwtPayload).role;

    // Check if the user has the 'Customer' role
    if (userRole !== 'Customer') {
      return NextResponse.json(
        { error: 'Access denied. Only customers can access this endpoint.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import User model
    const UserModel = (await import('@/models/User')).default;

    // Find the customer by ID
    const customer = await UserModel.findById(userId).select('rewardPoints rewardHistory name email').lean();

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate reward information
    const MAX_REWARD_POINTS = 100;
    const rewardPoints = customer.rewardPoints || 0;
    const discountUnlocked = rewardPoints >= MAX_REWARD_POINTS;
    const pointsRemaining = MAX_REWARD_POINTS - rewardPoints;

    return NextResponse.json({
      success: true,
      data: {
        customerId: customer._id,
        customerName: customer.name,
        rewardPoints: rewardPoints,
        maxPoints: MAX_REWARD_POINTS,
        discountUnlocked: discountUnlocked,
        pointsRemaining: pointsRemaining,
        recentHistory: customer.rewardHistory?.slice(-5) || [] // Last 5 entries
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching reward eligibility:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
