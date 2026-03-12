import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import ServiceModel from '@/models/Service';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import NotificationService from '@/app/utils/notifications';
import PaymentModel from '@/models/Payment';

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
    } catch (err) {
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
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: error.message || 'Internal server error',
      status: 500
    };
  }
}

// PATCH: Approve or reject therapist cancel request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // Authenticate and authorize business
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
    const { action } = body; // 'approve' or 'reject'

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return Response.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find business profile by user ID
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Find the booking
    const booking = await BookingModel.findById(bookingId)
      .populate('customer')
      .populate('therapist')
      .populate('service');
    
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify this booking belongs to this business
    const businessServices = await ServiceModel.find({ business: business._id }).select('_id');
    const serviceIds = businessServices.map(s => s._id.toString());
    
    if (!serviceIds.includes((booking.service as any)._id.toString())) {
      return Response.json(
        { success: false, error: 'Access denied. This booking does not belong to your business' },
        { status: 403 }
      );
    }

    // Verify booking is in therapist_cancel_requested status
    if (booking.status !== BookingStatus.TherapistCancelRequested) {
      return Response.json(
        { success: false, error: 'This booking is not in cancellation request status' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // APPROVE: Cancel booking and trigger refund
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        bookingId,
        { 
          status: BookingStatus.CancelledByTherapist,
          cancelledBy: booking.therapist?._id.toString(), // Therapist who initiated cancellation
          cancelledAt: new Date(),
          cancelReason: booking.therapistCancelReason,
          businessReviewStatus: 'approved',
          businessReviewedAt: new Date(),
          responseVisibleToBusinessOnly: true,
          notificationDestination: 'customer' // Notify customer about cancellation
        },
        { new: true }
      )
      .populate('customer')
      .populate({
        path: 'therapist',
        populate: { path: 'user' }
      })
      .populate('service');

      // Release the slot back to therapist's availability
      const slotDate = new Date(booking.date);
      const availabilitySlot = await TherapistAvailabilityModel.findOne({
        therapist: booking.therapist,
        date: {
          $gte: new Date(slotDate.setHours(0, 0, 0, 0)),
          $lt: new Date(slotDate.setHours(23, 59, 59, 999))
        },
        startTime: { $lte: booking.time },
        endTime: { $gt: booking.time },
      });

      if (availabilitySlot) {
        availabilitySlot.status = TherapistAvailabilityStatus.Available;
        await availabilitySlot.save();
      }

      // Process refund (50% of advance payment)
      // Note: Actual refund logic would integrate with payment gateway
      const advanceAmount = (booking.finalPrice || (booking.service as any)?.price || 0) * 0.5;
      
      // Update payment record to reflect refund
      await PaymentModel.updateMany(
        { booking: bookingId },
        { 
          status: 'refunded',
          refundAmount: advanceAmount,
          refundedAt: new Date()
        }
      );

      // Send notifications
      try {
        const notificationService = new NotificationService();
        
        // Notify customer
        await notificationService.sendNotification({
          type: 'booking_cancelled_by_therapist',
          to: (booking.customer as any).email,
          data: {
            booking: updatedBooking,
            customerName: (booking.customer as any).name,
            therapistName: (booking.therapist as any).user?.name || 'Unknown Therapist',
            serviceDetails: (booking.service as any)?.name || 'Unknown Service',
            refundAmount: advanceAmount
          }
        });

        // Notify therapist
        const therapistEmail = (booking.therapist as any).user?.email;
        if (therapistEmail) {
          await notificationService.sendNotification({
            type: 'therapist_cancel_request_approved',
            to: therapistEmail,
            data: {
              booking: updatedBooking,
              therapistName: (booking.therapist as any).user?.name,
              customerName: (booking.customer as any).name
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
      }

      return Response.json({
        success: true,
        message: 'Cancellation approved. Booking cancelled and 50% refund will be processed to customer.',
        data: {
          id: updatedBooking?._id.toString(),
          status: updatedBooking?.status,
          refundAmount: advanceAmount
        }
      });

    } else {
      // REJECT: Return booking to confirmed status
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        bookingId,
        { 
          status: BookingStatus.Confirmed,
          businessReviewStatus: 'rejected',
          businessReviewedAt: new Date(),
          responseVisibleToBusinessOnly: false,
          notificationDestination: 'therapist' // Notify therapist about rejection
        },
        { new: true }
      )
      .populate('customer')
      .populate({
        path: 'therapist',
        populate: { path: 'user' }
      })
      .populate('service');

      // Send notification to therapist
      try {
        const notificationService = new NotificationService();
        
        const therapistEmail = (booking.therapist as any).user?.email;
        if (therapistEmail) {
          await notificationService.sendNotification({
            type: 'therapist_cancel_request_rejected',
            to: therapistEmail,
            data: {
              booking: updatedBooking,
              therapistName: (booking.therapist as any).user?.name,
              customerName: (booking.customer as any).name,
              reason: 'Business rejected the cancellation request'
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      return Response.json({
        success: true,
        message: 'Cancellation request rejected. Booking remains confirmed.',
        data: {
          id: updatedBooking?._id.toString(),
          status: updatedBooking?.status
        }
      });
    }

  } catch (error: any) {
    console.error('Error processing cancellation request:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
