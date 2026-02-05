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

    // Parse request body
    const body = await req.json();
    const { newDate, newTime } = body;

    // Validate required fields
    if (!newDate || !newTime) {
      return Response.json(
        { success: false, error: 'New date and time are required' },
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

    // Check if booking can be rescheduled (only pending, confirmed, or rescheduled bookings)
    if (booking.status !== BookingStatus.Pending && 
        booking.status !== BookingStatus.Confirmed && 
        booking.status !== BookingStatus.Rescheduled) {
      return Response.json(
        { success: false, error: 'Only pending, confirmed, or rescheduled bookings can be rescheduled' },
        { status: 400 }
      );
    }

    // Prepare update data, preserving original date/time if not already stored
    const updateData: any = {
      date: new Date(newDate),
      time: newTime
    };

    // If this is the first reschedule, preserve the original date/time
    if (!booking.originalDate || !booking.originalTime) {
      updateData.originalDate = booking.date;
      updateData.originalTime = booking.time;
    }

    // Track who rescheduled and when
    updateData.rescheduledBy = decoded.id;
    updateData.rescheduledAt = new Date();

    // Update the booking status to rescheduled
    updateData.status = BookingStatus.Rescheduled;
    updateData.therapistResponded = true; // Mark that therapist has responded (business rescheduling counts as therapist response)

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

    // Send notification based on notification destination
    try {
      const notificationService = new NotificationService();
      await notificationService.sendBookingNotification(bookingId, 'reschedule', { newDate, newTime });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    return Response.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        id: updatedBooking!._id.toString(),
        customer: {
          id: (updatedBooking!.customer as any)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (updatedBooking!.customer as any).email,
          phone: phoneNumber
        },
        therapist: {
          id: (updatedBooking!.therapist as any)._id.toString(),
          fullName: (updatedBooking!.therapist as any).fullName,
          professionalTitle: (updatedBooking!.therapist as any).professionalTitle
        },
        service: {
          id: (updatedBooking!.service as any)._id.toString(),
          name: (updatedBooking!.service as any).name,
          price: (updatedBooking!.service as any).price,
          duration: (updatedBooking!.service as any).duration,
          description: (updatedBooking!.service as any).description
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

  } catch (error: any) {
    console.error('Error rescheduling booking:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}