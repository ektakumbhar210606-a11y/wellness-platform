import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import ServiceModel from '@/models/Service';
import BusinessModel from '@/models/Business';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import NotificationService from '@/app/utils/notifications';

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
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

    // Extract bookingId from params
    const awaitedParams = await params;
    const bookingId = awaitedParams.bookingId;

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { success: false, error: 'Invalid booking ID format' },
        { status: 400 }
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

    // Find the booking and verify it belongs to this therapist
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is assigned to this therapist
    if (booking.therapist.toString() !== therapist._id.toString()) {
      return Response.json(
        { success: false, error: 'Access denied. This booking is not assigned to you' },
        { status: 403 }
      );
    }

    // Also verify that the booking was explicitly assigned by an admin
    if (!booking.assignedByAdmin) {
      return Response.json(
        { success: false, error: 'Access denied. This booking was not explicitly assigned by an admin through the assign task functionality' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled (only pending or confirmed bookings)
    if (booking.status !== BookingStatus.Pending && booking.status !== BookingStatus.Confirmed) {
      return Response.json(
        { success: false, error: 'Only pending or confirmed bookings can be cancelled' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const bookingWithPopulatedData = await BookingModel.findByIdAndUpdate(
      bookingId,
      { status: BookingStatus.Cancelled },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'customer',
      select: 'firstName lastName email phone'
    })
    .populate({
      path: 'service',
      select: 'name price duration description business'
    });

    // Manually populate business data to avoid Mongoose schema registration issues
    let updatedBooking = bookingWithPopulatedData.toObject();
    if (updatedBooking.service && updatedBooking.service.business) {
      try {
        const business = await BusinessModel.findById(updatedBooking.service.business)
          .select('name')
          .lean();
        
        if (business) {
          updatedBooking.service.business = business;
        } else {
          updatedBooking.service.business = null;
        }
      } catch (error) {
        console.error('Error populating business data:', error);
        updatedBooking.service.business = null;
      }
    }

    // Send notification based on notification destination
    try {
      const notificationService = new NotificationService();
      await notificationService.sendBookingNotification(bookingId, 'cancel');
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    return Response.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as any)._id.toString(),
          firstName: (updatedBooking.customer as any).firstName,
          lastName: (updatedBooking.customer as any).lastName,
          email: (updatedBooking.customer as any).email,
          phone: (updatedBooking.customer as any).phone
        },
        service: {
          id: (updatedBooking.service as any)._id.toString(),
          name: (updatedBooking.service as any).name,
          price: (updatedBooking.service as any).price,
          duration: (updatedBooking.service as any).duration,
          description: (updatedBooking.service as any).description,
          business: updatedBooking.service.business ? {
            id: (updatedBooking.service.business as any)._id.toString(),
            name: (updatedBooking.service.business as any).name
          } : null
        },
        date: updatedBooking.date,
        time: updatedBooking.time,
        status: updatedBooking.status,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}