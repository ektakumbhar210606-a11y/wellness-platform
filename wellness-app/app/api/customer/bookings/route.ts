import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import UserModel from '../../../../models/User';
import ServiceModel, { IService } from '../../../../models/Service';
import TherapistModel, { ITherapist } from '../../../../models/Therapist';
import BusinessModel, { IBusiness } from '../../../../models/Business';
import PaymentModel from '../../../../models/Payment';
import * as jwt from 'jsonwebtoken';
import { formatBookingId } from '../../../../utils/bookingIdFormatter';
import { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize customer users
 */
async function requireCustomerAuth(request: NextRequest) {
  try {
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

/**
 * GET endpoint to retrieve all appointments for a customer
 * Protected by customer authentication
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Force model registration by doing simple finds
    // This ensures Mongoose knows about the schemas for populate()
    await ServiceModel.findOne({});
    await TherapistModel.findOne({});
    await BusinessModel.findOne({});
    
    // Authenticate and authorize the request
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const customerId = user.id;

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // Optional status filter
    const skip = (page - 1) * limit;

    // Build query for customer bookings - show all bookings for the customer
    const query: { customer: string; status?: string } = {
      customer: customerId
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
      .populate({
        path: 'service',
        select: 'name price duration description business'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle'
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    // Manually populate business data for each service to avoid Mongoose schema registration issues
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const populatedBooking = booking.toObject();

      const service = populatedBooking.service as Record<string, unknown>;
      if (populatedBooking.service && service.business) {
        try {
          const business = await BusinessModel.findById(service.business as Types.ObjectId)
            .select('name address currency')
            .lean();

          if (business) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).business = {
              id: business._id.toString(),
              name: business.name,
              address: business.address,
              currency: business.currency
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

      return populatedBooking;
    }));

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);

    // Format the bookings for the response
    const formattedBookings = await Promise.all(populatedBookings.map(async (booking) => {
      const service = booking.service as IService;
      const therapist = booking.therapist as ITherapist;
      const business = service?.business as IBusiness;

      // Check if there's a completed payment for this booking
      const payment = await PaymentModel.findOne({ 
        booking: booking._id, 
        status: 'completed' 
      }).lean();

      return {
        id: booking._id.toString(),
        displayId: formatBookingId(booking._id.toString()),
        service: service ? {
          id: service._id.toString(),
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description
        } : null,
        therapist: therapist ? {
          id: therapist._id.toString(),
          fullName: therapist.fullName,
          professionalTitle: therapist.professionalTitle
        } : null,
        business: business && business._id ? {
          id: business._id.toString(),
          name: business.name,
          address: business.address, // Include address with country for currency formatting
          currency: business.currency
        } : null,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        originalDate: booking.originalDate,
        originalTime: booking.originalTime,
        hasBeenRescheduled: !!booking.originalDate || !!booking.originalTime,
        responseVisibleToBusinessOnly: booking.responseVisibleToBusinessOnly,
        paymentStatus: payment ? 'completed' : 'pending',
        confirmedBy: booking.confirmedBy,
        confirmedAt: booking.confirmedAt,
        cancelledBy: booking.cancelledBy,
        cancelledAt: booking.cancelledAt,
        rescheduledBy: booking.rescheduledBy,
        rescheduledAt: booking.rescheduledAt
      };
    }));

    // Return clean JSON response with bookings and pagination info
    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching customer bookings:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}