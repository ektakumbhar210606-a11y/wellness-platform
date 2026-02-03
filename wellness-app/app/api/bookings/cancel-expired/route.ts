import { NextRequest } from 'next/server';
import { cancelExpiredBookings, isBookingExpired } from '@/utils/cancelExpiredBookings';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import * as jwt from 'jsonwebtoken';
import { BookingStatus } from '@/models/Booking';
import BookingModel from '@/models/Booking';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize admin/business users
 */
async function requireAuth(request: NextRequest) {
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

    // Check user role - allow admin or business roles
    const allowedRoles = ['admin', 'business', 'Admin', 'Business'];
    if (!allowedRoles.includes(decoded.role)) {
      return {
        authenticated: false,
        error: 'Access denied. Admin or business role required',
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
 * POST endpoint to manually trigger cancellation of expired bookings
 * This can be called by admin or business users
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await requireAuth(request);
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

    // Trigger the cancellation process
    const result = await cancelExpiredBookings();

    return Response.json({
      success: true,
      message: `Successfully cancelled ${result.cancelledCount} expired bookings`,
      data: {
        cancelledCount: result.cancelledCount,
        cancelledBookings: result.cancelledBookings.map(booking => ({
          id: booking._id.toString(),
          customer: (booking.customer as any).name || 'Unknown Customer',
          service: (booking.service as any).name || 'Unknown Service',
          date: booking.date,
          time: booking.time,
          previousStatus: booking.status,
          newStatus: 'cancelled'
        }))
      }
    });

  } catch (error: any) {
    console.error('Error in cancel-expired-bookings API:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check for expired bookings without cancelling them
 * Useful for previewing what would be cancelled
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await requireAuth(request);
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

    // Find bookings that are pending or confirmed
    const activeBookings = await BookingModel.find({
      $or: [
        { status: BookingStatus.Pending },
        { status: BookingStatus.Confirmed }
      ]
    }).populate('customer').populate('service');

    const now = new Date();
    const expiredBookings = activeBookings.filter(booking => 
      isBookingExpired(booking, now)
    );

    return Response.json({
      success: true,
      message: `Found ${expiredBookings.length} expired bookings`,
      data: {
        expiredCount: expiredBookings.length,
        expiredBookings: expiredBookings.map(booking => ({
          id: booking._id.toString(),
          customer: (booking.customer as any).name || 'Unknown Customer',
          service: (booking.service as any).name || 'Unknown Service',
          date: booking.date,
          time: booking.time,
          currentStatus: booking.status,
          wouldBeCancelled: true
        }))
      }
    });

  } catch (error: any) {
    console.error('Error in cancel-expired-bookings check API:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}