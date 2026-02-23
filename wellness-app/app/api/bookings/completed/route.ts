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
    // - paymentStatus = "paid" (fully paid)
    // - customer = logged-in user ID
    // Only show bookings that are both fully paid AND completed
    const filter = {
      customer: userId,
      status: BookingStatus.Completed,
      paymentStatus: 'paid'
    };

    // Execute query to get bookings
    const bookings = await Booking.find(filter).sort({ completedAt: -1 });

    // Transform the data for response with manual population
    const transformedBookings = [];
    
    for (const booking of bookings) {
      // Manually fetch service data
      let serviceData = null;
      if (booking.service) {
        const service = await Service.findById(booking.service);
        if (service) {
          serviceData = {
            id: service._id,
            name: service.name,
            description: service.description,
            duration: service.duration,
            price: service.price,
            category: service.category
          };
        }
      }
      
      // Manually fetch therapist data
      let therapistName = 'Unknown Therapist';
      if (booking.therapist) {
        const therapist = await Therapist.findById(booking.therapist);
        if (therapist && therapist.user) {
          const user = await User.findById(therapist.user);
          if (user) {
            therapistName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Therapist';
          }
        }
      }
      
      transformedBookings.push({
        id: booking._id,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        completedAt: booking.completedAt,
        notes: booking.notes,
        duration: booking.duration,
        reviewSubmitted: booking.reviewSubmitted || false,
        service: serviceData,
        therapist: {
          id: booking.therapist,
          name: therapistName
        }
      });
    }

    return NextResponse.json({
      bookings: transformedBookings,
      count: transformedBookings.length,
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