import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel from '../../../../../models/Booking';
import UserModel from '../../../../../models/User';
import ServiceModel from '../../../../../models/Service';
import TherapistModel from '../../../../../models/Therapist';
import BusinessModel from '../../../../../models/Business';
import * as jwt from 'jsonwebtoken';

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
    } catch (err) {
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
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: error.message || 'Internal server error',
      status: 500
    };
  }
}

/**
 * GET endpoint to retrieve upcoming appointments for a customer
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

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query for upcoming appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for date comparison

    const query = {
      customer: customerId,
      date: { $gte: today },
      status: 'confirmed'
    };

    // Fetch upcoming bookings with populated data
    const bookings = await BookingModel.find(query)
      .populate({
        path: 'service',
        select: 'name price duration description business'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle'
      })
      .sort({ date: 1, time: 1 }) // Sort by nearest date first, then by time
      .skip(skip)
      .limit(limit);

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
      const service = booking.service as any;
      const therapist = booking.therapist as any;
      const business = service?.business as any;

      return {
        id: booking._id.toString(),
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
        business: business ? {
          id: business._id.toString(),
          name: business.name,
          address: business.address,
          currency: business.currency
        } : null,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      };
    });

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

  } catch (error: any) {
    console.error('Error fetching upcoming appointments:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}