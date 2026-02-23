import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

/**
 * POST endpoint to create a new review for completed and fully paid bookings
 * Protected by authentication and customer authorization
 */
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

    // Check if the user has the 'Customer' role
    if (userRole !== 'Customer') {
      return NextResponse.json(
        { error: 'Access denied. Only customers can create reviews.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { bookingId, rating, comment } = body;

    // Validate required fields
    if (!bookingId || rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and rating are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof bookingId !== 'string' || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types: bookingId must be a string and rating must be a number' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (comment !== undefined && typeof comment !== 'string') {
      return NextResponse.json(
        { error: 'Comment must be a string if provided' },
        { status: 400 }
      );
    }

    // Import required models
    const reviewModule = await import('@/models/Review');
    const Review = reviewModule.default;

    const bookingModule = await import('@/models/Booking');
    const Booking = bookingModule.default;
    const { BookingStatus } = await import('@/models/Booking');

    const therapistModule = await import('@/models/Therapist');
    const Therapist = therapistModule.default;

    const userModule = await import('@/models/User');
    const User = userModule.default;

    // Validation Rule 1: Booking must exist
    const booking = await Booking.findById(bookingId)
      .populate('customer', '_id')
      .populate('therapist', '_id user')
      .populate('service', '_id');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      );
    }

    // Validation Rule 5: Logged-in user must match booking.customer
    if (booking.customer._id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only review your own bookings.' },
        { status: 403 }
      );
    }

    // Validation Rule 2: booking.status must be "completed"
    if (booking.status !== BookingStatus.Completed) {
      return NextResponse.json(
        { error: 'Booking must be completed to submit a review.' },
        { status: 400 }
      );
    }

    // Validation Rule 4: booking.reviewSubmitted must be false
    if (booking.reviewSubmitted === true) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking.' },
        { status: 409 }
      );
    }

    // Check for duplicate reviews using the unique index
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this booking.' },
        { status: 409 }
      );
    }

    // Business Logic Step 1: Create new Review document
    const newReview = new Review({
      bookingId,
      customer: userId,
      therapist: booking.therapist.user,
      service: booking.service._id,
      rating,
      comment: comment || undefined
    });

    const savedReview = await newReview.save();

    // Business Logic Step 2: Update booking - set reviewSubmitted = true
    await Booking.findByIdAndUpdate(bookingId, {
      reviewSubmitted: true
    });

    // Business Logic Step 3: Update therapist rating aggregation
    const therapistId = booking.therapist._id;
    
    // Get current therapist data
    const therapist = await Therapist.findById(therapistId);
    if (therapist) {
      const oldAvg = therapist.averageRating || 0;
      const oldCount = therapist.totalReviews || 0;
      const newCount = oldCount + 1;
      
      // Recalculate averageRating using the specified formula
      const newAvg = ((oldAvg * oldCount) + rating) / newCount;
      
      await Therapist.findByIdAndUpdate(therapistId, {
        averageRating: newAvg,
        totalReviews: newCount
      });
    }

    // Business Logic Step 4: Add 5 reward points to customer
    await User.findByIdAndUpdate(userId, {
      $inc: { rewardPoints: 5 }
    });

    // Return success response
    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review: {
          id: savedReview._id,
          bookingId: savedReview.bookingId,
          rating: savedReview.rating,
          comment: savedReview.comment,
          createdAt: savedReview.createdAt
        },
        rewardPointsEarned: 5
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error creating review:', error);

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

    // Handle duplicate key errors (from unique index on bookingId)
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Review already exists for this booking.' },
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