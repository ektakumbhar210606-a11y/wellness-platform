import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

/**
 * GET endpoint to fetch completed and fully paid bookings for logged-in customer
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
    const userRole = (decoded as JwtPayload).role;

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import required models
    const bookingModule = await import('@/models/Booking');
    const Booking = bookingModule.default;
    const { BookingStatus } = await import('@/models/Booking');

    const serviceModule = await import('@/models/Service');
    const Service = serviceModule.default;

    const therapistModule = await import('@/models/Therapist');
    const Therapist = therapistModule.default;

    const userModule = await import('@/models/User');
    const User = userModule.default;

    // Filter Conditions:
    // - status = "completed"
    // - customer = logged-in user ID
    // NOTE: Removed paymentStatus requirement to allow all completed bookings to be reviewed
    const filter = {
      customer: userId,
      status: BookingStatus.Completed
    };

    // Execute query with sorting and population
    const bookings = await Booking.find(filter)
      .populate({
        path: 'service',
        select: 'name description duration price category'
      })
      .populate({
        path: 'therapist',
        select: 'user fullName professionalTitle'
      })
      .sort({ completedAt: -1 }); // Sort by completedAt descending

    // Transform the data for response
    const transformedBookings = bookings.map(async booking => {
      // Try to get therapist name from TherapistProfile first
      let therapistName = 'Therapist';
      
      if (booking.therapist) {
        // First try to use fullName from Therapist model
        if (booking.therapist.fullName) {
          therapistName = booking.therapist.fullName;
        } else {
          // Fallback: Try to fetch TherapistProfile by userId
          try {
            const TherapistProfileModel = (await import('@/models/TherapistProfile')).TherapistProfile;
            const therapistProfile = await TherapistProfileModel.findOne({ 
              userId: booking.therapist.user 
            }).lean();
            
            if (therapistProfile && therapistProfile.fullName) {
              therapistName = therapistProfile.fullName;
            } else if (booking.therapist.professionalTitle) {
              therapistName = booking.therapist.professionalTitle;
            }
          } catch (error) {
            console.error('Error fetching therapist profile:', error);
            // Use fallback if TherapistProfile fetch fails
            if (booking.therapist.professionalTitle) {
              therapistName = booking.therapist.professionalTitle;
            }
          }
        }
      }
      
      return {
        id: booking._id,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        completedAt: booking.completedAt,
        notes: booking.notes,
        duration: booking.duration,
        reviewSubmitted: booking.reviewSubmitted || false,
        service: {
          id: booking.service._id,
          name: booking.service.name,
          description: booking.service.description,
          duration: booking.service.duration,
          price: booking.service.price,
          category: booking.service.category
        },
        therapist: {
          id: booking.therapist._id,
          name: therapistName
        }
      };
    });

    // Wait for all async transformations to complete
    const resolvedBookings = await Promise.all(transformedBookings);

    return NextResponse.json({
      bookings: resolvedBookings,
      count: resolvedBookings.length,
      message: 'Successfully retrieved completed bookings'
    });

  } catch (error: unknown) {
    console.error('Error fetching completed bookings:', error);

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