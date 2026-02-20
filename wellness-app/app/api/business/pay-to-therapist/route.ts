import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import BusinessModel from '@/models/Business';

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
    if (decoded.role.toLowerCase() !== 'business') {
      return {
        authenticated: false,
        error: 'Access denied. Business role required',
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate and authorize business user
    const authResult = await requireBusinessAuth(req);
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

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { bookingId } = body;

    // Validate booking ID
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

    // Find the booking and verify it belongs to this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map((service: any) => service._id);

    const booking = await BookingModel.findOne({
      _id: bookingId,
      service: { $in: serviceIds }
    });

    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found or does not belong to your business' },
        { status: 404 }
      );
    }

    // Validation checks:
    // 1. Ensure status is "completed"
    if (booking.status !== 'completed') {
      return Response.json(
        { success: false, error: 'Only completed bookings can be processed for therapist payout' },
        { status: 400 }
      );
    }

    // 2. Ensure paymentStatus is "completed" (equivalent to "paid" in the requirement)
    if (booking.paymentStatus !== 'completed') {
      return Response.json(
        { success: false, error: 'Only bookings with completed payment can be processed for therapist payout' },
        { status: 400 }
      );
    }

    // 3. Ensure therapistPayoutStatus is not already "paid"
    if (booking.therapistPayoutStatus === 'paid') {
      return Response.json(
        { success: false, error: 'Therapist payout has already been processed' },
        { status: 400 }
      );
    }

    // Calculate payout amount (40% of service price)
    const servicePrice = (booking.service as any)?.price || 0;
    const payoutAmount = servicePrice * 0.4;

    // Update the booking with payout information
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        therapistPayoutStatus: 'paid',
        therapistPayoutAmount: payoutAmount,
        therapistPaidAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return Response.json(
        { success: false, error: 'Failed to update therapist payout status' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Therapist payout processed successfully',
      data: {
        id: updatedBooking._id.toString(),
        therapistPayoutStatus: updatedBooking.therapistPayoutStatus,
        therapistPayoutAmount: updatedBooking.therapistPayoutAmount,
        therapistPaidAt: updatedBooking.therapistPaidAt
      }
    });

  } catch (error: unknown) {
    console.error('Error processing therapist payout:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}