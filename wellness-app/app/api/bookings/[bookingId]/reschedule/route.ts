import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import ServiceModel from '@/models/Service';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
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

export async function PATCH(req: NextRequest, { params }: { params: { bookingId: string } }) {
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

    const bookingId = params.bookingId;

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

    // Check if booking can be rescheduled (only pending or confirmed bookings)
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return Response.json(
        { success: false, error: 'Only pending or confirmed bookings can be rescheduled' },
        { status: 400 }
      );
    }

    // Update booking with new date and time
    const updateData: any = {
      date: new Date(newDate),
      time: newTime
    };

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    )
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .populate({
      path: 'service',
      select: 'name price duration description'
    })
    .populate({
      path: 'therapist',
      select: 'fullName professionalTitle'
    });
    
    // If customer doesn't have phone, try to get from associated Customer profile
    if (updatedBooking && !updatedBooking.customer.phone) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: updatedBooking.customer._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        (updatedBooking.customer as any).phone = customerProfile.phoneNumber;
      }
    }

    return Response.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        id: updatedBooking!._id.toString(),
        customer: {
          id: (updatedBooking!.customer as any)._id.toString(),
          name: (updatedBooking!.customer as any).name,
          email: (updatedBooking!.customer as any).email,
          phone: (updatedBooking!.customer as any).phone,
          firstName: (updatedBooking!.customer as any).name.split(' ')[0] || (updatedBooking!.customer as any).name,
          lastName: (updatedBooking!.customer as any).name.split(' ').slice(1).join(' ') || ''
        },
        service: {
          id: (updatedBooking!.service as any)._id.toString(),
          name: (updatedBooking!.service as any).name,
          price: (updatedBooking!.service as any).price,
          duration: (updatedBooking!.service as any).duration,
          description: (updatedBooking!.service as any).description
        },
        therapist: {
          id: (updatedBooking!.therapist as any)._id.toString(),
          fullName: (updatedBooking!.therapist as any).fullName,
          professionalTitle: (updatedBooking!.therapist as any).professionalTitle
        },
        date: updatedBooking!.date,
        time: updatedBooking!.time,
        status: updatedBooking!.status,
        createdAt: updatedBooking!.createdAt
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