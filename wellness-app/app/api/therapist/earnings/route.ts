import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/lib/middleware/authMiddleware';

// Require therapist authentication
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
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Find all bookings assigned to this therapist that are completed
    const bookings = await BookingModel.find({
      therapist: therapist._id,
      status: 'completed'
    })
    .populate('service')
    .populate('customer')
    .sort({ createdAt: -1 });

    // Transform bookings to earnings records with the expected structure
    const earnings = bookings.map(booking => {
      // Calculate therapist's share (40% of service price)
      const service = booking.service as any;
      const therapistShare = service ? service.price * 0.4 : 0;
      
      // Extract customer details
      const customer = booking.customer as any;
      let customerData: any = { name: 'Unknown Customer' };
      if (customer) {
        if (customer.firstName || customer.lastName) {
          customerData = {
            id: customer._id?.toString(),
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
          };
        } else if (customer.name) {
          customerData = {
            id: customer._id?.toString(),
            name: customer.name,
            firstName: customer.name.split(' ')[0] || '',
            lastName: customer.name.split(' ').slice(1).join(' ') || ''
          };
        } else {
          customerData = {
            id: customer._id?.toString(),
            name: 'Unknown Customer',
            firstName: '',
            lastName: ''
          };
        }
      }

      return {
        id: booking._id.toString(),
        displayId: booking.bookingId || booking._id.toString(),
        service: {
          id: service?._id?.toString() || 'unknown',
          name: service ? service.name : 'Unknown Service',
          price: service ? service.price : 0
        },
        customer: customerData,
        date: booking.date,
        therapistPayoutAmount: booking.therapistPayoutAmount || therapistShare,
        therapistPaidAt: booking.therapistPaidAt,
        paymentStatus: booking.therapistPayoutStatus || 'pending',
        bookingDate: booking.createdAt // Store the original booking date
      };
    });

    return Response.json({
      success: true,
      message: 'Earnings retrieved successfully',
      data: earnings
    });
  } catch (error: any) {
    console.error('Error fetching therapist earnings:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}