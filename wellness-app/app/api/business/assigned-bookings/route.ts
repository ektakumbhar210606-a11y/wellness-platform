import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import BusinessModel from '@/models/Business';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const therapistId = searchParams.get('therapistId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find services associated with this business
    const businessServices = await ServiceModel.find({ business: business._id }).select('_id');
    const serviceIds = businessServices.map((service: any) => service._id);

    // Build query for assigned bookings
    const query: any = {
      service: { $in: serviceIds },
      assignedByAdmin: true,  // Only bookings explicitly assigned by admin
      therapist: { $exists: true, $ne: null }  // Only bookings with assigned therapist
    };

    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'cancelled', 'rescheduled'].includes(status)) {
      query.status = status;
    }

    // Filter by specific therapist if provided
    if (therapistId) {
      query.therapist = therapistId;
    }

    console.log('Assigned bookings query:', JSON.stringify(query, null, 2));

    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
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
      })
      .sort({ updatedAt: -1, createdAt: -1 }) // Sort by most recent updates first
      .skip(skip)
      .limit(limit);

    console.log(`Found ${bookings.length} assigned bookings`);

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);

    // Handle phone number for all bookings asynchronously
    const formattedBookings = await Promise.all(bookings.map(async (booking) => {
      const customer = booking.customer as any;
      const therapist = booking.therapist as any;
      const service = booking.service as any;

      // Split the full name into first and last name
      let firstName = '';
      let lastName = '';
      if (customer?.name) {
        const nameParts = customer.name.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Handle phone number - try to get from Customer model if not in User model
      let phoneNumber = customer?.phone;
      if (!phoneNumber) {
        // Import Customer model here to avoid circular dependencies
        const CustomerModel = (await import('@/models/Customer')).default;
        const customerProfile = await CustomerModel.findOne({ user: customer?._id }).select('phoneNumber');
        if (customerProfile && customerProfile.phoneNumber) {
          phoneNumber = customerProfile.phoneNumber;
        }
      }

      return {
        id: booking._id.toString(),
        customer: {
          id: customer?._id?.toString(),
          firstName: firstName,
          lastName: lastName,
          email: customer?.email,
          phone: phoneNumber
        },
        therapist: {
          id: therapist?._id?.toString(),
          fullName: therapist?.fullName,
          professionalTitle: therapist?.professionalTitle,
          userId: therapist?.user?.toString()
        },
        service: {
          id: service?._id?.toString(),
          name: service?.name,
          price: service?.price,
          duration: service?.duration,
          description: service?.description
        },
        date: booking.date,
        time: booking.time,
        status: booking.status,
        notes: booking.notes,
        assignedByAdmin: booking.assignedByAdmin,
        assignedById: booking.assignedById,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        // Add reschedule tracking data
        originalDate: booking.originalDate ? new Date(booking.originalDate) : null,
        originalTime: booking.originalTime || null,
        rescheduledBy: booking.rescheduledBy,
        rescheduledAt: booking.rescheduledAt,
        confirmedBy: booking.confirmedBy,
        confirmedAt: booking.confirmedAt,
        cancelledBy: booking.cancelledBy,
        cancelledAt: booking.cancelledAt,
        // Add status change history
        statusHistory: [
          {
            status: booking.status,
            timestamp: booking.updatedAt || booking.createdAt,
            changedBy: 'system'
          }
        ]
      };
    }));

    return Response.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalAssigned: total,
          pending: await BookingModel.countDocuments({ ...query, status: 'pending' }),
          confirmed: await BookingModel.countDocuments({ ...query, status: 'confirmed' }),
          cancelled: await BookingModel.countDocuments({ ...query, status: 'cancelled' }),
          rescheduled: await BookingModel.countDocuments({ ...query, status: 'rescheduled' })
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching assigned bookings:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}