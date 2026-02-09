import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { formatBookingId } from '@/utils/bookingIdFormatter';

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

export async function GET(req: NextRequest) {
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

    await connectToDatabase();

    // Get therapist profile by user ID
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      console.error('Therapist profile not found for user ID:', decoded.id);
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }
    
    console.log('Found therapist profile:', {
      therapistId: therapist._id,
      userId: therapist.user,
      fullName: therapist.fullName
    });

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query for assigned bookings - ONLY bookings explicitly assigned by admin
    // This strictly filters to show only bookings that were assigned through the 'assign task' functionality
    const query: any = {
      therapist: therapist._id,
      assignedByAdmin: true,  // Only bookings explicitly assigned by admin through assign task
      status: { $in: ['pending', 'confirmed', 'rescheduled'] }  // Show pending, confirmed, and rescheduled bookings
    };
    
    console.log('Therapist booking query:', JSON.stringify(query, null, 2));

    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'rescheduled'].includes(status)) {
      query.status = status;
    }

    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
      .populate({
        path: 'customer',
        select: 'firstName lastName email phone'
      })
      .populate({
        path: 'service',
        select: 'name price duration description business'
      })
      .sort({ date: 1, time: 1 }) // Sort by date and time
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${bookings.length} bookings matching query`);

    // Manually populate business data for each service to avoid Mongoose schema registration issues
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
    const formattedBookings = populatedBookings.map(booking => {
      const customer = booking.customer as any;
      const service = booking.service as any;
      const business = service?.business as any;

      return {
        id: booking._id.toString(),
        displayId: formatBookingId(booking._id.toString()),
        customer: {
          id: customer._id.toString(),
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        },
        service: {
          id: service._id.toString(),
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description
        },
        business: business && business._id ? {
          id: business._id.toString(),
          name: business.name,
          address: business.address,
          currency: business.currency
        } : null,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        notes: booking.notes,
        assignedByAdmin: booking.assignedByAdmin,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      };
    });

    return Response.json({
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
    });

  } catch (error: any) {
    console.error('Error fetching therapist bookings:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}