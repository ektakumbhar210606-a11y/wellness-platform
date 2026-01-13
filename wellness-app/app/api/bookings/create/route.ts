import { NextRequest, NextResponse } from 'next/server';

/**
 * POST endpoint to create a new booking
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
    const userId = decoded.id;
    const userRole = decoded.role;

    // Check if the user has the 'Customer' role
    if (userRole !== 'Customer') {
      return NextResponse.json(
        { error: 'Access denied. Only customers can create bookings.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { therapist_id, service_id, date, time } = body;

    // Validate required fields
    if (!therapist_id || !service_id || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: therapist_id, service_id, date, and time are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof therapist_id !== 'string' || typeof service_id !== 'string' || 
        typeof date !== 'string' || typeof time !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data types: therapist_id, service_id, date, and time must be strings' },
        { status: 400 }
      );
    }

    // Import required models
    const bookingModule = await import('@/models/Booking');
    const Booking = bookingModule.default;
    const { BookingStatus } = await import('@/models/Booking');

    const availabilityModule = await import('@/models/TherapistAvailability');
    const TherapistAvailability = availabilityModule.default;
    const { TherapistAvailabilityStatus } = await import('@/models/TherapistAvailability');

    // Check if the requested therapist availability slot exists and is available
    const slotDate = new Date(date);
    const availabilitySlot = await TherapistAvailability.findOne({
      therapist: therapist_id,
      date: {
        $gte: new Date(slotDate.setHours(0, 0, 0, 0)), // Start of the day
        $lt: new Date(slotDate.setHours(23, 59, 59, 999)) // End of the day
      },
      startTime: { $lte: time }, // Slot starts at or before the requested time
      endTime: { $gt: time },    // Slot ends after the requested time
      status: TherapistAvailabilityStatus.Available // Slot must be available
    });

    if (!availabilitySlot) {
      return NextResponse.json(
        { error: 'Requested time slot is not available for the selected therapist. Please choose a different time or therapist.' },
        { status: 409 }
      );
    }

    // Create and save the new booking document
    const newBooking = new Booking({
      customer: userId,
      therapist: therapist_id,
      service: service_id,
      date: new Date(date),
      time: time,
      status: BookingStatus.Pending // Default to pending
    });

    const savedBooking = await newBooking.save();

    // Update the corresponding availability slot to mark it as "Booked"
    availabilitySlot.status = TherapistAvailabilityStatus.Booked;
    await availabilitySlot.save();

    // Return the created booking document (excluding sensitive information)
    return NextResponse.json(
      {
        id: savedBooking._id,
        customer: savedBooking.customer,
        therapist: savedBooking.therapist,
        service: savedBooking.service,
        date: savedBooking.date,
        time: savedBooking.time,
        status: savedBooking.status,
        createdAt: savedBooking.createdAt,
        updatedAt: savedBooking.updatedAt
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);

    // Import models to check for validation errors
    const bookingModule = await import('@/models/Booking');
    const Booking = bookingModule.default;

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
        { error: 'A similar booking already exists' },
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