import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel, { BookingStatus } from '../../../../models/Booking';
import ServiceModel from '../../../../models/Service';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import BusinessModel from '../../../../models/Business';
import TherapistModel from '../../../../models/Therapist';
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

export async function GET(req: NextRequest) {
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

    await connectToDatabase();

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusFilter = searchParams.get('status'); // Filter by booking status

    // First get all services for this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map((service) => service._id);

    // Build query to find bookings with therapist responses
    // These are bookings that were assigned to therapists and they have responded
    // Include bookings with therapist responses regardless of current status (except completed)
    // Include paid bookings as well since business should still be able to confirm therapist responses after payment
    const query: any = { 
      service: { $in: serviceIds },
      status: { $ne: BookingStatus.Completed }, // Exclude completed bookings
      assignedByAdmin: true // Only bookings that were explicitly assigned by admin
    };

    // For therapist response management, we want to show:
    // 1. Bookings with therapist responses that haven't been confirmed by business yet
    // 2. Bookings that are paid but still need business confirmation of therapist response
    // 3. Bookings that are confirmed but still need business confirmation of therapist response
    // This allows business to confirm therapist responses even after customer payment

    // Add status filter if provided
    if (statusFilter && ['therapist_confirmed', 'therapist_rejected'].includes(statusFilter)) {
      query.status = statusFilter;
    }
    
    // For the booking responses endpoint, we want to include paid bookings as well
    // since business should still be able to confirm therapist responses after payment
    // The query already excludes completed bookings, so we don't need additional filtering

    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
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
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Manually populate business data for each service to include currency information
    for (const booking of bookings) {
      const service = booking.service as Record<string, unknown>;
      if (booking.service && service.business) {
        try {
          const businessPopulated = await BusinessModel.findById(service.business as Types.ObjectId)
            .select('name address currency')
            .lean();

          if (businessPopulated) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).business = {
              id: businessPopulated._id.toString(),
              name: businessPopulated.name,
              address: businessPopulated.address,
              currency: businessPopulated.currency
            };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).business = undefined;
          }
        } catch (error: unknown) {
          console.error('Error populating business data for booking:', booking._id, error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (service as any).business = undefined;
        }
      }
    }

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);
    
    // Format the bookings for the response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      customer: {
        id: (booking.customer as any)._id.toString(),
        name: (booking.customer as any).name,
        email: (booking.customer as any).email,
        phone: (booking.customer as any).phone,
        firstName: (booking.customer as any).name.split(' ')[0] || (booking.customer as any).name,
        lastName: (booking.customer as any).name.split(' ').slice(1).join(' ') || ''
      },
      service: {
        id: (booking.service as any)._id.toString(),
        name: (booking.service as any).name,
        price: (booking.service as any).price,
        duration: (booking.service as any).duration,
        description: (booking.service as any).description,
        currency: (booking.service as any).business?.currency || 'INR'
      },
      therapist: {
        id: (booking.therapist as any)._id.toString(),
        fullName: (booking.therapist as any).fullName,
        professionalTitle: (booking.therapist as any).professionalTitle
      },
      date: booking.date,
      time: booking.time,
      duration: booking.duration || (booking.service as any).duration,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      therapistResponded: booking.therapistResponded,
      responseVisibleToBusinessOnly: booking.responseVisibleToBusinessOnly,
      originalDate: booking.originalDate,
      originalTime: booking.originalTime,
      rescheduledBy: booking.rescheduledBy,
      rescheduledAt: booking.rescheduledAt,
      confirmedBy: booking.confirmedBy,
      confirmedAt: booking.confirmedAt,
      cancelledBy: booking.cancelledBy,
      cancelledAt: booking.cancelledAt,
      assignedByAdmin: booking.assignedByAdmin,
      assignedById: booking.assignedById
    }));

    return Response.json({
      success: true,
      message: 'Booking responses retrieved successfully',
      data: formattedBookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching booking responses:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}