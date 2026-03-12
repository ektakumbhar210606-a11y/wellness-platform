import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';

export async function POST(request: NextRequest) {
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
        { error: 'Access denied. Only businesses can calculate bonuses.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { therapistId, month, year } = body;

    // Validate required fields
    if (!therapistId || month === undefined || year === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: therapistId, month, and year are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof therapistId !== 'string' || typeof month !== 'number' || typeof year !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types: therapistId must be a string, month and year must be numbers' },
        { status: 400 }
      );
    }

    // Validate month and year ranges
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
    
    const therapistBonusModule = await import('@/models/TherapistBonus');
    const TherapistBonus = therapistBonusModule.default;

    const TherapistModelModule = await import('@/models/Therapist');
    const TherapistModel = TherapistModelModule.default;

    // Get the therapist profile to retrieve the user ID
    const therapistProfile = await TherapistModel.findOne({ _id: therapistId });
    
    if (!therapistProfile) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Use the therapist's user ID for review lookup
    const therapistUserId = therapistProfile.user.toString();

    // Check if bonus already exists for that therapist + month + year
    const existingBonus = await TherapistBonus.findOne({
      therapist: therapistUserId, // Use therapist's user ID, not profile ID
      month: month,
      year: year
    });

    if (existingBonus) {
      return NextResponse.json(
        { error: 'Bonus already calculated' },
        { status: 409 }
      );
    }

    // Create date range for the specified month
    const startDate = new Date(year, month - 1, 1); // First day of the month
    const endDate = new Date(year, month, 0);       // Last day of the month (0th day of next month)

    // MongoDB aggregation pipeline to calculate average rating and total reviews
    const result = await Review.aggregate([
      {
        $match: {
          therapist: new Types.ObjectId(therapistUserId),
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
    const averageRating = parseFloat(monthlyStats.averageRating?.toFixed(2)) || 0;
    const totalReviews = monthlyStats.totalReviews || 0;

    // Check eligibility criteria
    // Updated criteria: Average rating ≥ 4.0 AND minimum 2 reviews in the month
    if (averageRating < 4.0 || totalReviews < 2) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Not eligible',
          averageRating,
          totalReviews
        },
        { status: 200 }
      );
    }

    // Calculate bonus amount
    const baseBonus = 3000;
    
    // Get therapist's cancellation penalty percentage
    const penalty = therapistProfile.bonusPenaltyPercentage || 0;
    
    // Apply cancellation penalty to calculate final bonus
    // Formula: finalBonus = baseBonus - (baseBonus * penalty / 100)
    const finalBonus = baseBonus - (baseBonus * penalty / 100);
    
    // Ensure bonus doesn't go below 0
    const bonusAmount = Math.max(0, finalBonus);

    // Create TherapistBonus record
    const newBonus = new TherapistBonus({
      therapist: therapistUserId, // Use therapist's user ID, not profile ID
      business: userId, // The business/user who calculated the bonus
      month: month,
      year: year,
      averageRating: averageRating,
      totalReviews: totalReviews,
      bonusAmount: bonusAmount,
      status: 'pending' // Default status
    });

    const savedBonus = await newBonus.save();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        bonus: {
          id: savedBonus._id,
          therapist: savedBonus.therapist,
          therapistId: savedBonus.therapist, // Return user ID for consistency
          business: savedBonus.business,
          month: savedBonus.month,
          year: savedBonus.year,
          averageRating: savedBonus.averageRating,
          totalReviews: savedBonus.totalReviews,
          bonusAmount: savedBonus.bonusAmount,
          status: savedBonus.status,
          createdAt: savedBonus.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error calculating therapist bonus:', error);

    // Handle validation errors from Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      const messages: Record<string, string> = {};
      for (const field in (error as any).errors) {
        messages[field] = (error as any).errors[field].message;
      }
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    // Handle duplicate key errors (from unique index on therapist + month + year)
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Bonus already calculated' },
        { status: 409 }
      );
    }

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