import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

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
    const userRole = (decoded as JwtPayload).role;

    // Check if the user has the 'Business' or 'Provider' role (case insensitive)
    const normalizedUserRole = userRole.toLowerCase();
    if (normalizedUserRole !== 'business' && normalizedUserRole !== 'provider') {
      return NextResponse.json(
        { error: 'Access denied. Only businesses can view bonuses.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import required models
    const therapistBonusModule = await import('@/models/TherapistBonus');
    const TherapistBonus = therapistBonusModule.default;
    
    const userModule = await import('@/models/User');
    const User = userModule.default;

    // Fetch bonuses with therapist details
    const bonuses = await TherapistBonus.find({ business: userId })
      .populate('therapist', 'name')
      .sort({ createdAt: -1 });

    // Format the response with therapist names
    const formattedBonuses = bonuses.map(bonus => ({
      id: bonus._id.toString(),
      therapistId: bonus.therapist._id.toString(),
      therapistName: bonus.therapist.name,
      month: bonus.month,
      year: bonus.year,
      averageRating: bonus.averageRating,
      totalReviews: bonus.totalReviews,
      bonusAmount: bonus.bonusAmount,
      status: bonus.status,
      createdAt: bonus.createdAt
    }));

    return NextResponse.json(
      {
        success: true,
        bonuses: formattedBonuses
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error fetching therapist bonuses:', error);

    // Handle CastError (invalid ID format)
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid ID format' },
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