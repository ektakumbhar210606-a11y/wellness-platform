import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import ServiceModel from '../../../../models/Service';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import BusinessModel from '../../../../models/Business';
import TherapistModel from '../../../../models/Therapist';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize therapist users
 */
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
    } catch (verificationError: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
    // Authenticate and authorize therapist user
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

    await connectToDatabase();

    // Find therapist profile
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusFilter = searchParams.get('status'); // Filter by booking status

    // First get all services where this therapist is assigned
    const services = await ServiceModel.find({ therapists: therapist._id });
    const serviceIds = services.map((service) => service._id);

    // Build query to find business confirmation responses for this therapist
    // These are bookings where therapist responded and business took action (confirmed, cancelled, rescheduled)
    // Business action is indicated by responseVisibleToBusinessOnly being false (business approved the therapist response)
    const query: any = { 
      service: { $in: serviceIds },
      therapist: therapist._id,
      therapistResponded: true, // Only bookings where therapist has responded
      responseVisibleToBusinessOnly: false // Only show responses that are visible to therapist (business has approved)
    };

    // Add status filter if provided
    if (statusFilter && ['confirmed', 'cancelled', 'rescheduled'].includes(statusFilter)) {
      query.status = statusFilter;
    }

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
      .sort({ confirmedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Manually populate business data for each service
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const populatedBooking = booking.toObject();
      
      if (populatedBooking.service && populatedBooking.service.business) {
        try {
          const business = await BusinessModel.findById(populatedBooking.service.business)
            .select('name address currency')
            .lean();
          
          if (business) {
            populatedBooking.service.business = {
              id: business._id.toString(),
              name: business.name,
              address: business.address,
              currency: business.currency
            };
          } else {
            populatedBooking.service.business = null;
          }
        } catch (error) {
          console.error('Error populating business data:', error);
          populatedBooking.service.business = null;
        }
      }
      
      return populatedBooking;
    }));
    
    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);
    
    // Format the bookings for the response
    const formattedBookings = populatedBookings.map(booking => ({
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
        currency: (booking.service as any)?.business?.currency || 'INR'
      },
      business: (booking.service as any)?.business ? {
        id: (booking.service as any).business.id,
        name: (booking.service as any).business.name,
        address: (booking.service as any).business.address
      } : null,
      date: booking.date,
      time: booking.time,
      duration: booking.duration || (booking.service as any).duration,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      confirmedBy: booking.confirmedBy,
      confirmedAt: booking.confirmedAt,
      cancelledBy: booking.cancelledBy,
      cancelledAt: booking.cancelledAt,
      rescheduledBy: booking.rescheduledBy,
      rescheduledAt: booking.rescheduledAt,
      originalDate: booking.originalDate,
      originalTime: booking.originalTime
    }));

    return Response.json({
      success: true,
      message: 'Business confirmation responses retrieved successfully',
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
    console.error('Error fetching business confirmation responses:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}