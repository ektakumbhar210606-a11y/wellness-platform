import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import ServiceModel from '@/models/Service';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize therapist users
 */
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
    } catch (verificationError: unknown) {
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize therapist user
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

    // Find therapist profile by user ID
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Find bookings where therapistPayoutStatus is "paid"
    const bookings = await BookingModel.find({
      therapist: therapist._id,
      therapistPayoutStatus: 'paid'
    })
    .populate({
      path: 'service',
      select: 'name price duration description'
    })
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .sort({ therapistPaidAt: -1 }); // Sort by paid date, newest first

    // Format the bookings for the response
    const formattedBookings = bookings.map(booking => {
      // Extract first and last name from customer name
      let firstName = '';
      let lastName = '';
      if (booking.customer && (booking.customer as any).name) {
        const nameParts = (booking.customer as any).name.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      return {
        id: booking._id.toString(),
        service: {
          id: (booking.service as any)._id.toString(),
          name: (booking.service as any).name,
          price: (booking.service as any).price,
          duration: (booking.service as any).duration,
          description: (booking.service as any).description
        },
        customer: {
          id: (booking.customer as any)._id.toString(),
          name: (booking.customer as any).name,
          email: (booking.customer as any).email,
          phone: (booking.customer as any).phone,
          firstName,
          lastName
        },
        date: booking.date,
        therapistPayoutAmount: booking.therapistPayoutAmount,
        therapistPaidAt: booking.therapistPaidAt,
        displayId: booking._id.toString() // Could be enhanced with a formatted booking ID
      };
    });

    return Response.json({
      success: true,
      message: 'Earnings data retrieved successfully',
      data: formattedBookings
    });

  } catch (error: unknown) {
    console.error('Error fetching therapist earnings:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}