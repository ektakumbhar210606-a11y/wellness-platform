import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import ServiceModel from '@/models/Service';
import BusinessModel from '@/models/Business';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
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

    // Check if booking can be cancelled (only pending, confirmed, or rescheduled bookings)
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
        therapistResponded: true, // Mark that therapist has responded
        responseVisibleToBusinessOnly: true, // Therapist responses should only be visible to business
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
      path: 'service',
      select: 'name price duration description business'
    });

    // Release the slot by updating the therapist's availability back to available
    if (updatedBooking) {
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
    if (updatedBooking && updatedBooking.customer && (updatedBooking.customer as any).name) {
      const nameParts = (updatedBooking.customer as any).name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Handle phone number - try to get from Customer model if not in User model
    let phoneNumber = (updatedBooking!.customer as any).phone;
    if (!phoneNumber) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (updatedBooking!.customer as any)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }

    // Manually populate business data to avoid Mongoose schema registration issues
    let finalBookingData = updatedBooking.toObject();
    if (finalBookingData.service && finalBookingData.service.business) {
      try {
        const business = await BusinessModel.findById(finalBookingData.service.business)
          .select('name')
          .lean();
        
        if (business) {
          finalBookingData.service.business = business;
        } else {
          finalBookingData.service.business = null;
        }
      } catch (error) {
        console.error('Error populating business data:', error);
        finalBookingData.service.business = null;
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
        id: finalBookingData._id.toString(),
        customer: {
          id: (finalBookingData.customer as any)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (finalBookingData.customer as any).email,
          phone: phoneNumber
        },
        service: {
          id: (finalBookingData.service as any)._id.toString(),
          name: (finalBookingData.service as any).name,
          price: (finalBookingData.service as any).price,
          duration: (finalBookingData.service as any).duration,
          description: (finalBookingData.service as any).description,
          business: finalBookingData.service.business ? {
            id: (finalBookingData.service.business as any)._id.toString(),
            name: (finalBookingData.service.business as any).name
          } : null
        },
        date: finalBookingData.date,
        time: finalBookingData.time,
        originalDate: finalBookingData.originalDate ? new Date(finalBookingData.originalDate) : null,
        originalTime: finalBookingData.originalTime || null,
        status: finalBookingData.status,
        createdAt: finalBookingData.createdAt,
        updatedAt: finalBookingData.updatedAt
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