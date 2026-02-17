import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import UserModel, { IUser } from '@/models/User';
import ServiceModel, { IService } from '@/models/Service';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import NotificationService from '@/app/utils/notifications';
import BusinessModel, { IBusiness } from '@/models/Business';

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

    // Also verify that the booking was explicitly assigned by an admin
    if (!booking.assignedByAdmin) {
      return Response.json(
        { success: false, error: 'Access denied. This booking was not explicitly assigned by an admin through the assign task functionality' },
        { status: 403 }
      );
    }

    // Check if booking is in therapist confirmed or therapist rejected status
    if (booking.status !== BookingStatus.TherapistConfirmed && booking.status !== BookingStatus.TherapistRejected) {
      return Response.json(
        { success: false, error: 'Only therapist confirmed or rejected bookings can be processed by business' },
        { status: 400 }
      );
    }

    // Parse request body for additional options
    const body = await req.json();
    const { action } = body; // Options: 'reject_with_customer_notification', 'revert_to_pending_for_reassignment'

    let updateData: any = {
      therapistResponded: true, // Mark that therapist has responded
      confirmedBy: decoded.id,
      confirmedAt: new Date()
    };

    if (action === 'revert_to_pending') {
      // Revert to pending so it can be reassigned to another therapist
      updateData.status = BookingStatus.Pending;
      updateData.responseVisibleToBusinessOnly = false; // So customer knows it's being worked on again
      updateData.assignedByAdmin = false; // Clear assignment so it can be reassigned
      updateData.assignedById = undefined;
      updateData.therapist = null; // Clear therapist assignment
    } else {
      // Default action: reject the therapist's response and make visible to customer
      updateData.status = BookingStatus.Cancelled; // Or we could set it to a specific rejected status
      updateData.responseVisibleToBusinessOnly = false; // Make response visible to customer so they know the status
    }

    const bookingWithPopulatedData = await BookingModel.findByIdAndUpdate(
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
    });

    // Split the full name into first and last name
    let firstName = '';
    let lastName = '';
    if (bookingWithPopulatedData && bookingWithPopulatedData.customer && (bookingWithPopulatedData.customer as IUser).name) {
      const nameParts = (bookingWithPopulatedData.customer as IUser).name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Handle phone number - try to get from Customer model if not in User model
    let phoneNumber = (bookingWithPopulatedData!.customer as IUser).phone;
    if (!phoneNumber) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (bookingWithPopulatedData!.customer as IUser)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }

    // Manually populate business data to avoid Mongoose schema registration issues
    const updatedBooking = bookingWithPopulatedData.toObject();
    const service = updatedBooking.service as Record<string, unknown>;
    if (updatedBooking.service && service.business) {
      try {
        const businessPopulated = await BusinessModel.findById(service.business as Types.ObjectId)
          .select('name')
          .lean();

        if (businessPopulated) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (service as any).business = {
            id: businessPopulated._id.toString(),
            name: businessPopulated.name
          };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (service as any).business = undefined;
        }
      } catch (error: unknown) {
        console.error('Error populating business data:', error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).business = undefined;
      }
    }

    // Send notification based on the action
    try {
      const notificationService = new NotificationService();
      if (action === 'revert_to_pending') {
        // Send notification about reassignment
        await notificationService.sendBookingNotification(bookingId, 'reschedule');
      } else {
        // Send cancellation notification
        await notificationService.sendBookingNotification(bookingId, 'cancel');
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }

    const actionMessage = action === 'revert_to_pending' 
      ? 'Booking reverted to pending for reassignment' 
      : 'Therapist response processed and customer notified';

    return Response.json({
      success: true,
      message: actionMessage,
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as IUser)._id.toString(),
          firstName: firstName,
          lastName: lastName,
          email: (updatedBooking.customer as IUser).email,
          phone: phoneNumber
        },
        service: {
          id: (updatedBooking.service as IService)._id.toString(),
          name: (updatedBooking.service as IService).name,
          price: (updatedBooking.service as IService).price,
          duration: (updatedBooking.service as IService).duration,
          description: (updatedBooking.service as IService).description,
          business: updatedBooking.service.business && (updatedBooking.service.business as IBusiness)._id ? {
            id: (updatedBooking.service.business as IBusiness)._id.toString(),
            name: (updatedBooking.service.business as IBusiness).name
          } : null
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