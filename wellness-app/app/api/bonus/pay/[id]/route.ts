import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
        { error: 'Access denied. Only businesses can mark bonuses as paid.' },
        { status: 403 }
      );
    }

    // Get bonus ID from params
    const bonusId = params.id;

    // Validate bonus ID
    if (!bonusId) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import required models
    const therapistBonusModule = await import('@/models/TherapistBonus');
    const TherapistBonus = therapistBonusModule.default;

    // Find the bonus and verify it belongs to the current business
    const bonus = await TherapistBonus.findOne({ _id: bonusId, business: userId });

    if (!bonus) {
      return NextResponse.json(
        { error: 'Bonus not found or does not belong to your business' },
        { status: 404 }
      );
    }

    // Update the bonus status to 'paid'
    const updatedBonus = await TherapistBonus.findOneAndUpdate(
      { _id: bonusId, business: userId },
      { status: 'paid' },
      { new: true, runValidators: true }
    );

    if (!updatedBonus) {
      return NextResponse.json(
        { error: 'Failed to update bonus status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bonus: {
          id: updatedBonus._id.toString(),
          therapistId: updatedBonus.therapist.toString(),
          businessId: updatedBonus.business.toString(),
          month: updatedBonus.month,
          year: updatedBonus.year,
          averageRating: updatedBonus.averageRating,
          totalReviews: updatedBonus.totalReviews,
          bonusAmount: updatedBonus.bonusAmount,
          status: updatedBonus.status,
          createdAt: updatedBonus.createdAt
        }
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error updating bonus status:', error);

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