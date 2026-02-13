import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import ServiceModel from '@/models/Service';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize business users
 */
async function requireBusinessAuth(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return {
        authenticated: false,
        error: 'Authentication token required',
        status: 401
      };
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError: unknown) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Check user role - allow both 'Business' and 'business' for backward compatibility
    if (decoded.role.toLowerCase() !== 'business' && decoded.role.toLowerCase() !== 'admin') {
      return {
        authenticated: false,
        error: 'Access denied. Business or admin role required',
        status: 403
      };
    }

    // Get user to verify existence
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return {
        authenticated: false,
        error: 'User not found',
        status: 404
      };
    }

    return {
      authenticated: true,
      user: decoded
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: error.message || 'Internal server error',
      status: 500
    };
  }
}

/**
 * POST endpoint to approve a booking
 * Protected by business authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const awaitedParams = await params;
    const { bookingId } = awaitedParams;

    // Validate bookingId
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Force model registration by accessing them
    await ServiceModel.findOne({});
    await BusinessModel.findOne({});
    
    // Authenticate and authorize the request
    const authResult = await requireBusinessAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    
    // Find the booking by ID
    const booking = await BookingModel.findById(bookingId)
      .populate('customer')
      .populate('therapist')
      .populate('service')
      .populate('business');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if the requesting user's business matches the booking's business
    // This ensures that only the business that owns the booking can approve it
    if (booking.business && booking.business.toString() !== user.id && user.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. You can only approve bookings for your own business.' },
        { status: 403 }
      );
    }

    // Only allow approval of bookings with pending status
    if (booking.status !== BookingStatus.Pending) {
      return NextResponse.json(
        { error: `Cannot approve booking with status '${booking.status}'. Only pending bookings can be approved.` },
        { status: 400 }
      );
    }

    // Update the booking status to confirmed
    booking.status = BookingStatus.Confirmed;
    await booking.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking approved successfully',
      data: {
        id: booking._id.toString(),
        status: booking.status,
        customer: booking.customer,
        service: booking.service,
        therapist: booking.therapist,
        date: booking.date,
        time: booking.time,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }
    });

  } catch (error: unknown) {
    console.error('Error approving booking:', error);
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}