import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus, IBooking } from '@/models/Booking';
import UserModel, { IUser } from '@/models/User';
import ServiceModel, { IService } from '@/models/Service';
import BusinessModel from '@/models/Business';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import NotificationService from '@/app/utils/notifications';
import TherapistModel, { ITherapist } from '@/models/Therapist';
import PaymentModel from '@/models/Payment';
import { isBookingWithin24Hours } from '@/app/utils/bookingTimeUtils';

async function requireCustomerAuth(request: NextRequest) {
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

    // Check user role - allow both 'Customer' and 'customer' for backward compatibility
    if (decoded.role.toLowerCase() !== 'customer') {
      return {
        authenticated: false,
        error: 'Access denied. Customer role required',
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // Authenticate customer user
    const authResult = await requireCustomerAuth(req);
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

    // Parse request body
    const body = await req.json();
    const { cancelReason } = body || {};

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { success: false, error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the booking
    const booking = await BookingModel.findById(bookingId)
      .populate('therapist', 'fullName professionalTitle user')
      .populate('service');
    
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking ownership
    const bookingCustomerId = booking.customer?.toString() || '';
    const userId = decoded.id;
    
    if (bookingCustomerId !== userId) {
      return Response.json(
        { success: false, error: 'Access denied. You can only cancel your own bookings.' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled by customer
    // Allow customer to cancel pending, therapist_confirmed, confirmed, paid, or rescheduled bookings
    const allowedStatuses = [
      BookingStatus.Pending,
      BookingStatus.TherapistConfirmed,
      BookingStatus.Confirmed,
      BookingStatus.Paid,
      BookingStatus.Rescheduled
    ];
    
    console.log('Checking cancellation eligibility:', {
      bookingId: booking._id,
      currentStatus: booking.status,
      allowedStatuses,
      isAllowed: allowedStatuses.includes(booking.status)
    });
    
    if (!allowedStatuses.includes(booking.status)) {
      return Response.json(
        { 
          success: false, 
          error: `This booking cannot be cancelled as it has status '${booking.status}'. Only bookings with status 'pending', 'confirmed', 'paid', or 'rescheduled' can be cancelled.` 
        },
        { status: 400 }
      );
    }

    // Check 24-hour restriction policy
    if (isBookingWithin24Hours(booking.date, booking.time)) {
      return Response.json(
        { 
          success: false, 
          error: 'Bookings cannot be cancelled within 24 hours of the scheduled time. Please contact the business directly if you need to cancel.' 
        },
        { status: 400 }
      );
    }

    // Calculate refund amount with 10% penalty
    // Customer paid 50% advance, so refund 90% of that (10% penalty)
    const totalAmount = booking.finalPrice || (booking.service as any)?.price || 0;
    const advancePaid = totalAmount * 0.5; // 50% advance
    const penaltyAmount = advancePaid * 0.1; // 10% penalty on advance
    const refundAmount = advancePaid - penaltyAmount; // 90% of advance = 45% of total

    // Update booking status to cancelled
    const updateData: any = {
      status: BookingStatus.Cancelled,
      therapistResponded: true,
      responseVisibleToBusinessOnly: false,
      // Track who cancelled and when
      cancelledBy: decoded.id,
      cancelledAt: new Date(),
      // Store cancellation reason
      customerCancelReason: cancelReason?.trim() || 'Customer requested cancellation',
      // Store refund calculation details
      refundAmount: refundAmount,
      refundPenaltyPercentage: 10,
      notificationDestination: 'business' // Notify business about customer cancellation
    };

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'customer',
        select: 'name email phone'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle user'
      })
      .populate({
        path: 'service',
        select: 'name price duration description'
      });

    // Release the slot by updating the therapist's availability back to available
    if (updatedBooking && booking) {
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
    }

    // Process refund - update payment status to refunded with penalty
    if (advancePaid > 0) {
      await PaymentModel.updateMany(
        { booking: bookingId },
        { 
          status: 'refunded',
          refundAmount: refundAmount,
          penaltyAmount: penaltyAmount,
          refundedAt: new Date()
        }
      );
    }

    // Send notification to business
    try {
      const notificationService = new NotificationService();
      await notificationService.sendBookingNotification(bookingId, 'cancel');
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    // Split the full name into first and last name
    let firstName = '';
    let lastName = '';
    if (updatedBooking && updatedBooking.customer && (updatedBooking.customer as IUser).name) {
      const nameParts = (updatedBooking.customer as IUser).name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts[1] || '';
    }

    // Handle phone number - try to get from Customer model if not in User model
    let phoneNumber = (updatedBooking!.customer as IUser).phone;
    if (!phoneNumber) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (updatedBooking!.customer as IUser)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }

    return Response.json({
      success: true,
      message: 'Booking cancelled successfully with 10% cancellation fee applied',
      data: {
        id: updatedBooking!._id.toString(),
        customer: {
          id: (updatedBooking!.customer as IUser)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (updatedBooking!.customer as IUser).email,
          phone: phoneNumber
        },
        service: {
          id: (updatedBooking!.service as IService)._id.toString(),
          name: (updatedBooking!.service as IService).name,
          price: (updatedBooking!.service as IService).price,
          duration: (updatedBooking!.service as IService).duration,
          description: (updatedBooking!.service as IService).description
        },
        date: updatedBooking!.date,
        time: updatedBooking!.time,
        originalDate: updatedBooking!.originalDate,
        originalTime: updatedBooking!.originalTime,
        status: updatedBooking!.status,
        createdAt: updatedBooking!.createdAt,
        updatedAt: updatedBooking!.updatedAt,
        refundDetails: {
          totalAmount: totalAmount,
          advancePaid: advancePaid,
          penaltyAmount: penaltyAmount,
          penaltyPercentage: 10,
          refundAmount: refundAmount
        }
      }
    });

  } catch (error: unknown) {
    console.error('Error cancelling booking:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
