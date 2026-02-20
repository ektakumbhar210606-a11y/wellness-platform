import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel, { BookingStatus } from '../../../../../models/Booking';
import ServiceModel from '../../../../../models/Service';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import BusinessModel from '../../../../../models/Business';
import TherapistModel from '../../../../../models/Therapist';
import NotificationService from '@/app/utils/notifications';

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
    } catch (verificationError: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
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

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Find the booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if the booking belongs to a service of this business
    const bookingService = await ServiceModel.findById(booking.service);
    if (!bookingService || bookingService.business.toString() !== business._id.toString()) {
      return Response.json(
        { success: false, error: 'Booking does not belong to your business' },
        { status: 403 }
      );
    }

    // Parse request body for action
    const body = await req.json();
    const { action, newDate, newTime, notes } = body; // Actions: 'confirm', 'cancel', 'reschedule'

    if (!action) {
      return Response.json(
        { success: false, error: 'Action is required (confirm, cancel, or reschedule)' },
        { status: 400 }
      );
    }

    if (!['confirm', 'cancel', 'reschedule'].includes(action)) {
      return Response.json(
        { success: false, error: 'Invalid action. Must be one of: confirm, cancel, reschedule' },
        { status: 400 }
      );
    }

    // Check if booking has had a therapist response at some point
    // Allow actions on bookings that were initially responded to by therapists
    // but haven't reached final state of completed
    if (booking.status === BookingStatus.Completed) {
      return Response.json(
        { success: false, error: 'Cannot process actions on completed bookings' },
        { status: 400 }
      );
    }

    // Allow actions on cancelled bookings if the action is reschedule
    if (booking.status === BookingStatus.Cancelled && action !== 'reschedule') {
      return Response.json(
        { success: false, error: 'Cannot process this action on cancelled bookings' },
        { status: 400 }
      );
    }

    // Verify that this booking originally had a therapist response
    // by checking if it was ever in therapist_confirmed or therapist_rejected status
    // or if it's in a state that resulted from a therapist response
    // Include paid bookings since business should be able to confirm therapist responses after payment
    const hasTherapistResponse = booking.status === BookingStatus.TherapistConfirmed || 
                         booking.status === BookingStatus.TherapistRejected ||
                         booking.status === BookingStatus.Confirmed ||
                         booking.status === BookingStatus.Paid ||
                         booking.status === BookingStatus.Pending ||
                         booking.status === BookingStatus.NoShow ||
                         booking.status === BookingStatus.Rescheduled;

    if (!hasTherapistResponse) {
      return Response.json(
        { success: false, error: 'This booking does not have a therapist response to process' },
        { status: 400 }
      );
    }

    let updateData: any = {
      confirmedBy: decoded.id,
      confirmedAt: new Date()
    };

    // Handle different actions
    if (action === 'confirm') {
      // Confirm the therapist's response
      // For paid/partial payment bookings, keep the payment status but make the response visible to customer
      // For other bookings, change status to 'confirmed'
      if (booking.status === BookingStatus.Paid || booking.paymentStatus === 'partial') {
        // Keep existing payment status for paid/partial payment bookings
        // Just make response visible to customer and mark as confirmed by business
        updateData.status = booking.status; // Preserve existing status
        updateData.responseVisibleToBusinessOnly = false; // Make response visible to customer
        updateData.paymentStatus = booking.paymentStatus; // Preserve payment status
      } else {
        // For non-paid bookings, change status to confirmed
        updateData.status = BookingStatus.Confirmed;
        updateData.responseVisibleToBusinessOnly = false; // Make response visible to customer
      }
    } else if (action === 'cancel') {
      // Cancel the booking by changing status to 'cancelled'
      updateData.status = BookingStatus.Cancelled;
      updateData.cancelledBy = decoded.id;
      updateData.cancelledAt = new Date();
      updateData.responseVisibleToBusinessOnly = false; // Make cancellation visible to customer
    } else if (action === 'reschedule') {
      // Reschedule the booking
      if (!newDate || !newTime) {
        return Response.json(
          { success: false, error: 'New date and time are required for rescheduling' },
          { status: 400 }
        );
      }

      // Validate date and time format
      const parsedDate = new Date(newDate);
      if (isNaN(parsedDate.getTime())) {
        return Response.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(newTime)) {
        return Response.json(
          { success: false, error: 'Invalid time format. Use HH:MM format (24-hour)' },
          { status: 400 }
        );
      }

      // Update booking with new date/time
      updateData.date = parsedDate;
      updateData.time = newTime;
      updateData.status = BookingStatus.Confirmed; // Set status to confirmed after rescheduling
      updateData.rescheduledBy = decoded.id;
      updateData.rescheduledAt = new Date();
      updateData.responseVisibleToBusinessOnly = false; // Make rescheduling visible to customer
      
      // Preserve original date/time for tracking
      if (!booking.originalDate) {
        updateData.originalDate = booking.date;
        updateData.originalTime = booking.time;
      }
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Update the booking
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
      path: 'service',
      select: 'name price duration description business'
    })
    .populate({
      path: 'therapist',
      select: 'fullName professionalTitle'
    });

    if (!updatedBooking) {
      return Response.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Send notification to therapist about business decision
    try {
      const notificationService = new NotificationService();
      
      // Determine the action type for the notification
      let notificationAction: 'confirm' | 'cancel' | 'reschedule' = 'confirm';
      if (action === 'cancel') {
        notificationAction = 'cancel';
      } else if (action === 'reschedule') {
        notificationAction = 'reschedule';
      }
      
      // Send booking notification using the service
      await notificationService.sendBookingNotification(
        updatedBooking._id.toString(), 
        notificationAction,
        action === 'reschedule' ? { newDate: newDate, newTime: newTime } : undefined
      );
    } catch (notificationError) {
      console.error('Error sending notification to therapist:', notificationError);
      // Continue with response even if notification fails
    }

    // Split the full name into first and last name
    let firstName = '';
    let lastName = '';
    if (updatedBooking.customer && (updatedBooking.customer as any).name) {
      const nameParts = (updatedBooking.customer as any).name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Handle phone number - try to get from Customer model if not in User model
    let phoneNumber = (updatedBooking.customer as any).phone;
    if (!phoneNumber) {
      const CustomerModel = (await import('../../../../../models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (updatedBooking.customer as any)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }

    return Response.json({
      success: true,
      message: `Booking ${action} action completed successfully`,
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as any)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (updatedBooking.customer as any).email,
          phone: phoneNumber
        },
        service: {
          id: (updatedBooking.service as any)._id.toString(),
          name: (updatedBooking.service as any).name,
          price: (updatedBooking.service as any).price,
          duration: (updatedBooking.service as any).duration,
          description: (updatedBooking.service as any).description
        },
        therapist: {
          id: (updatedBooking.therapist as any)._id.toString(),
          fullName: (updatedBooking.therapist as any).fullName,
          professionalTitle: (updatedBooking.therapist as any).professionalTitle
        },
        date: updatedBooking.date,
        time: updatedBooking.time,
        originalDate: updatedBooking.originalDate ? new Date(updatedBooking.originalDate) : null,
        originalTime: updatedBooking.originalTime || null,
        status: updatedBooking.status,
        createdAt: updatedBooking.createdAt,
        updatedAt: updatedBooking.updatedAt
      }
    });

  } catch (error: unknown) {
    console.error('Error processing therapist response:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}