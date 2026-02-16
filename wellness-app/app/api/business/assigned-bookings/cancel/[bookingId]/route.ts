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
import { ITherapist } from '@/models/Therapist';

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
    const service = await ServiceModel.findById(booking.service);
    if (!service || service.business.toString() !== business._id.toString()) {
      return Response.json(
        { success: false, error: 'Booking does not belong to your business' },
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
    if (booking.status !== BookingStatus.Pending && booking.status !== BookingStatus.Confirmed && booking.status !== BookingStatus.Rescheduled) {
      return Response.json(
        { success: false, error: 'Only pending, confirmed, or rescheduled bookings can be cancelled' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        status: BookingStatus.Cancelled,
        therapistResponded: true, // Mark that therapist has responded (business cancelling counts as therapist response)
        responseVisibleToBusinessOnly: false, // Business cancellation makes response visible to customer
        // Track who cancelled and when
        cancelledBy: decoded.id,
        cancelledAt: new Date()
      },
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
          $gte: new Date(slotDate.setHours(0, 0, 0, 0)), // Start of the day
          $lt: new Date(slotDate.setHours(23, 59, 59, 999)) // End of the day
        },
        startTime: { $lte: booking.time }, // Slot starts at or before the requested time
        endTime: { $gt: booking.time },    // Slot ends after the requested time
      });

      if (availabilitySlot) {
        // Update the availability slot back to available
        availabilitySlot.status = TherapistAvailabilityStatus.Available;
        await availabilitySlot.save();
      }
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
        id: updatedBooking!._id.toString(),
        customer: {
          id: (updatedBooking!.customer as IUser)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (updatedBooking!.customer as IUser).email,
          phone: phoneNumber
        },
        therapist: {
          id: (updatedBooking!.therapist as ITherapist)._id.toString(),
          fullName: (updatedBooking!.therapist as ITherapist).fullName,
          professionalTitle: (updatedBooking!.therapist as ITherapist).professionalTitle
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
        updatedAt: updatedBooking!.updatedAt
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