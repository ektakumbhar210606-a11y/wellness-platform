import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import BusinessModel from '@/models/Business';
import ServiceModel from '@/models/Service';
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

    // Parse request body
    const body = await req.json();
    const { cancelReason } = body;

    // Validate cancel reason
    if (!cancelReason || typeof cancelReason !== 'string') {
      return Response.json(
        { success: false, error: 'Cancellation reason is required' },
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
    const booking = await BookingModel.findById(bookingId)
      .populate('service')
      .populate('customer');
    
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

    // Check if booking can be cancelled (only confirmed or rescheduled bookings)
    if (booking.status !== BookingStatus.Confirmed && booking.status !== BookingStatus.Rescheduled) {
      return Response.json(
        { success: false, error: 'Only confirmed or rescheduled bookings can have cancellation requested' },
        { status: 400 }
      );
    }

    // Update booking status to therapist_cancel_requested
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        status: BookingStatus.TherapistCancelRequested,
        therapistCancelReason: cancelReason,
        therapistCancelRequestedAt: new Date(),
        businessReviewStatus: 'pending',
        responseVisibleToBusinessOnly: true, // Only visible to business
        notificationDestination: 'business' // Send notification to business
      },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .populate({
      path: 'service',
      select: 'name price duration description business'
    })
    .populate({
      path: 'therapist',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

    // Get business information for notification
    let business = null;
    if ((booking.service as any).business) {
      business = await BusinessModel.findById((booking.service as any).business).select('name email');
    }

    // Send notification to business
    try {
      const notificationService = new NotificationService();
      
      // Split therapist name
      let therapistName = 'Unknown Therapist';
      if (updatedBooking?.therapist && (updatedBooking.therapist as any).user?.name) {
        therapistName = (updatedBooking.therapist as any).user.name;
      }

      // Customer name
      let customerName = 'Unknown Customer';
      if (updatedBooking?.customer && (updatedBooking.customer as any).name) {
        customerName = (updatedBooking.customer as any).name;
      }

      // Service details
      const serviceDetails = (updatedBooking?.service as any)?.name || 'Unknown Service';

      await notificationService.sendNotification({
        type: 'therapist_cancel_request',
        to: business?.email || '',
        data: {
          booking: updatedBooking,
          customerName,
          therapistName,
          serviceDetails,
          cancelReason
        }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    return Response.json({
      success: true,
      message: 'Cancellation request submitted to business successfully',
      data: {
        id: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        therapistCancelReason: updatedBooking?.therapistCancelReason,
        businessReviewStatus: updatedBooking?.businessReviewStatus,
        therapistCancelRequestedAt: updatedBooking?.therapistCancelRequestedAt
      }
    });

  } catch (error: any) {
    console.error('Error submitting cancellation request:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
