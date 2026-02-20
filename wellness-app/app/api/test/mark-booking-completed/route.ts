import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { JwtPayload } from '@/lib/middleware/authMiddleware';

// Require therapist authentication
async function requireTherapistAuth(request: NextRequest) {
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
    } catch (err) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Check user role - allow both 'Therapist' and 'therapist' for backward compatibility
    if (decoded.role.toLowerCase() !== 'therapist') {
      return {
        authenticated: false,
        error: 'Access denied. Therapist role required',
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

// TESTING ROUTE - REMOVE IN PRODUCTION
export async function POST(req: NextRequest) {
  try {
    // Authenticate and authorize therapist
    const authResult = await requireTherapistAuth(req);
    if (!authResult.authenticated) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const decoded = authResult.user;
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get therapist profile by user ID
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { bookingId } = body;

    // Validate bookingId
    if (!bookingId) {
      return Response.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { success: false, error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    // Find the booking and verify it belongs to this therapist
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is already completed
    if (booking.status === BookingStatus.Completed) {
      return Response.json(
        { success: false, error: 'Booking is already marked as completed' },
        { status: 400 }
      );
    }

    // Check if booking is assigned to this therapist
    if (booking.therapist.toString() !== therapist._id.toString()) {
      return Response.json(
        { success: false, error: 'Access denied. This booking is not assigned to you' },
        { status: 403 }
      );
    }

    // Update booking status to completed
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        status: BookingStatus.Completed,
        paymentStatus: 'completed', // Set to completed to indicate full payment
        therapistPayoutStatus: 'pending', // Set therapist payout to pending
        completedAt: new Date(), // Add completedAt field
        // Track who marked as completed and when
        confirmedBy: decoded.id,
        confirmedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return Response.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Booking marked as completed successfully (TEST ROUTE)',
      data: {
        id: updatedBooking._id.toString(),
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
        therapistPayoutStatus: updatedBooking.therapistPayoutStatus,
        completedAt: updatedBooking.completedAt,
        confirmedBy: updatedBooking.confirmedBy,
        confirmedAt: updatedBooking.confirmedAt
      }
    });

  } catch (error: any) {
    console.error('Error marking booking as completed (TEST ROUTE):', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}