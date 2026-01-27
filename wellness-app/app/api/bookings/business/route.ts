import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import BusinessModel from '../../../../models/Business';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

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

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = { business: business._id };
    
    // Add status filter if provided
    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
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
        select: 'name price duration description'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);

    // Format the bookings for the response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      customer: {
        id: (booking.customer as any)._id.toString(),
        firstName: (booking.customer as any).firstName,
        lastName: (booking.customer as any).lastName,
        email: (booking.customer as any).email,
        phone: (booking.customer as any).phone
      },
      service: {
        id: (booking.service as any)._id.toString(),
        name: (booking.service as any).name,
        price: (booking.service as any).price,
        duration: (booking.service as any).duration,
        description: (booking.service as any).description
      },
      therapist: {
        id: (booking.therapist as any)._id.toString(),
        fullName: (booking.therapist as any).fullName,
        professionalTitle: (booking.therapist as any).professionalTitle
      },
      date: booking.date,
      timeSlot: booking.timeSlot,
      duration: booking.duration,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt
    }));

    return Response.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: formattedBookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching business bookings:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { bookingId, status, notes } = body;

    // Validate required fields
    if (!bookingId || !status) {
      return Response.json(
        { success: false, error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['confirmed', 'cancelled'].includes(status)) {
      return Response.json(
        { success: false, error: 'Status must be either confirmed or cancelled' },
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

    // Find and update the booking if it belongs to the business
    const booking = await BookingModel.findOne({
      _id: bookingId,
      business: business._id
    });

    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found or does not belong to your business' },
        { status: 404 }
      );
    }

    // Check if booking can be updated (only pending bookings can be confirmed/cancelled)
    if (booking.status !== 'pending') {
      return Response.json(
        { success: false, error: 'Only pending bookings can be confirmed or cancelled' },
        { status: 400 }
      );
    }

    // Update booking status
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    ).populate({
      path: 'customer',
      select: 'firstName lastName email phone'
    })
    .populate({
      path: 'service',
      select: 'name price duration description'
    })
    .populate({
      path: 'therapist',
      select: 'fullName professionalTitle'
    });

    return Response.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as any)._id.toString(),
          firstName: (updatedBooking.customer as any).firstName,
          lastName: (updatedBooking.customer as any).lastName,
          email: (updatedBooking.customer as any).email,
          phone: (updatedBooking.customer as any).phone
        },
        service: {
          id: (updatedBooking.service as any)._id.toString(),
          name: (updatedBooking.service as any).name,
          price: (updatedBooking.service as any).price,
          duration: (updatedBooking.service as any).duration,
          description: (updatedBooking.service as any).description
        },
        therapist: {
          id: (updatedBooking.therapist as any)._id.toString(),
          fullName: (updatedBooking.therapist as any).fullName,
          professionalTitle: (updatedBooking.therapist as any).professionalTitle
        },
        date: updatedBooking.date,
        timeSlot: updatedBooking.timeSlot,
        duration: updatedBooking.duration,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        createdAt: updatedBooking.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error updating booking:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}