import { NextRequest, NextResponse } from 'next/server';

/**
 * POST endpoint to create a new review for a completed booking
 * Protected by authentication and role-based authorization
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
    const userId = decoded.userId;
    const userRole = decoded.role;

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
    const { booking_id, rating, comment } = body;

    // Validate required fields
    if (!booking_id || rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id and rating are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof booking_id !== 'string' || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types: booking_id must be a string and rating must be a number' },
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

    // Validate that the booking exists and has a status of "Completed"
    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found. Cannot create review for non-existent booking.' },
        { status: 409 }
      );
    }

    // Check if the booking belongs to the current user (customer)
    if (booking.customer.toString() !== userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only review your own bookings.' },
        { status: 403 }
      );
    }

    // Check if the booking status is "Completed"
    if (booking.status !== BookingStatus.Completed) {
      return NextResponse.json(
        { error: 'Cannot create review for booking that is not completed. Booking status must be "Completed".' },
        { status: 409 }
      );
    }

    // Check if a review already exists for this booking to prevent duplicate reviews
    const existingReview = await Review.findOne({ booking: booking_id });
    if (existingReview) {
      return NextResponse.json(
        { error: 'A review already exists for this booking. Each booking can only have one review.' },
        { status: 409 }
      );
    }

    // Create and save the new review document
    const newReview = new Review({
      booking: booking_id,
      rating: rating,
      comment: comment || undefined, // Use undefined if comment is empty or not provided
      reviewDate: new Date()
    });

    const savedReview = await newReview.save();

    // Update the corresponding therapist's average rating
    // First, get the therapist ID from the booking
    const therapistId = booking.therapist;

    // Get all reviews for bookings with this therapist to calculate the new average
    // We need to join Booking and Review to find all reviews for bookings with this therapist
    const allBookingsWithTherapist = await Booking.find({ 
      therapist: therapistId,
      status: BookingStatus.Completed
    }).select('_id');

    const bookingIds = allBookingsWithTherapist.map(b => b._id);
    
    // Find all reviews for those bookings
    const therapistReviews = await Review.find({ 
      booking: { $in: bookingIds } 
    });

    // Calculate the new average rating
    const totalRating = therapistReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / therapistReviews.length;

    // Update the therapist's rating
    await Therapist.findByIdAndUpdate(
      therapistId,
      { rating: averageRating },
      { new: true }
    );

    // Return the created review document (excluding sensitive information)
    return NextResponse.json(
      {
        id: savedReview._id,
        booking: savedReview.booking,
        rating: savedReview.rating,
        comment: savedReview.comment,
        reviewDate: savedReview.reviewDate,
        createdAt: savedReview.createdAt,
        updatedAt: savedReview.updatedAt
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating review:', error);

    // Import models to check for validation errors
    const reviewModule = await import('@/models/Review');
    const Review = reviewModule.default;

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages: Record<string, string> = {};
      for (const field in error.errors) {
        messages[field] = error.errors[field].message;
      }
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A review for this booking already exists' },
        { status: 409 }
      );
    }

    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
      // Invalid ID format
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