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

    // Check if the user has the 'Therapist' role (case insensitive)
    if ((decoded as JwtPayload).role.toLowerCase() !== 'therapist') {
      return NextResponse.json(
        { error: 'Access denied. Only therapists can access this endpoint.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Validate required parameters
    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: month and year are required' },
        { status: 400 }
      );
    }

    // Convert parameters to numbers
    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);

    // Validate data types and ranges
    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid data types: month and year must be numbers' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (year < 1970 || year > 2100) {
      return NextResponse.json(
        { error: 'Year must be a valid year between 1970 and 2100' },
        { status: 400 }
      );
    }

    // Import required models
    const reviewModule = await import('@/models/Review');
    const Review = reviewModule.default;

    // Create date range for the specified month
    const startDate = new Date(year, month - 1, 1); // First day of the month
    const endDate = new Date(year, month, 0);       // Last day of the month (0th day of next month)

    // MongoDB aggregation pipeline to calculate average rating and total reviews
    const result = await Review.aggregate([
      {
        $match: {
          therapist: userId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // Extract the results or set defaults if no reviews exist
    const monthlyStats = result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };

    // Format the response
    const response = {
      success: true,
      averageRating: parseFloat(monthlyStats.averageRating?.toFixed(2)) || 0,
      totalReviews: monthlyStats.totalReviews || 0
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error calculating monthly average rating:', error);

    // Handle CastError (invalid ID format)
    if (error instanceof Error && (error as any).name === 'CastError') {
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