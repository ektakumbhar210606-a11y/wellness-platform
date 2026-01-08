import { NextRequest, NextResponse } from 'next/server';

/**
 * POST endpoint to create a new therapist availability slot
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

    // Check if the user has the 'Therapist' role
    if (userRole !== 'Therapist') {
      return NextResponse.json(
        { error: 'Access denied. Only therapists can create availability slots.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { date, start_time, end_time } = body;

    // Validate required fields
    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: date, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof date !== 'string' || typeof start_time !== 'string' || typeof end_time !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data types: date, start_time, and end_time must be strings' },
        { status: 400 }
      );
    }

    // Import TherapistAvailability model
    const availabilityModule = await import('@/models/TherapistAvailability');
    const TherapistAvailability = availabilityModule.default;
    const { TherapistAvailabilityStatus } = await import('@/models/TherapistAvailability');

    // Check for overlapping slots for the same therapist on the same date
    // Convert date string to Date object
    const slotDate = new Date(date);

    // Query for existing slots that overlap with the requested time range
    const overlappingSlots = await TherapistAvailability.find({
      therapist: userId,
      date: {
        $gte: new Date(slotDate.setHours(0, 0, 0, 0)), // Start of the day
        $lt: new Date(slotDate.setHours(23, 59, 59, 999)) // End of the day
      },
      $or: [
        // New slot starts before existing slot ends AND ends after existing slot starts
        {
          $and: [
            { startTime: { $lt: end_time } },
            { endTime: { $gt: start_time } }
          ]
        }
      ]
    });

    if (overlappingSlots.length > 0) {
      return NextResponse.json(
        { error: 'Overlapping availability slot found. Please choose a different time range.' },
        { status: 409 }
      );
    }

    // Create and save the new availability document
    const newAvailability = new TherapistAvailability({
      therapist: userId,
      date: new Date(date),
      startTime: start_time,
      endTime: end_time,
      status: TherapistAvailabilityStatus.Available // Default to available
    });

    const savedAvailability = await newAvailability.save();

    // Return the created availability document (excluding sensitive information)
    return NextResponse.json(
      {
        id: savedAvailability._id,
        therapist: savedAvailability.therapist,
        date: savedAvailability.date,
        startTime: savedAvailability.startTime,
        endTime: savedAvailability.endTime,
        status: savedAvailability.status,
        createdAt: savedAvailability.createdAt,
        updatedAt: savedAvailability.updatedAt
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating availability slot:', error);

    // Import TherapistAvailability model to check for validation errors
    const availabilityModule = await import('@/models/TherapistAvailability');
    const TherapistAvailability = availabilityModule.default;

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
        { error: 'An overlapping availability slot already exists' },
        { status: 409 }
      );
    }

    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
      // Invalid user ID format
      return NextResponse.json(
        { error: 'Invalid user ID format' },
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