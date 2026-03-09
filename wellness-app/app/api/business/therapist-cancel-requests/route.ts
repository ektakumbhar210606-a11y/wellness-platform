import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

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

// GET: Fetch all therapist cancel requests for this business
export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize business
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

    // Find business profile by user ID
    const business = await BusinessModel.findOne({ user: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Find all services offered by this business
    const businessServices = await ServiceModel.find({ business: business._id }).select('_id');
    const serviceIds = businessServices.map(s => s._id);

    // Find all bookings with therapist cancel requests for these services
    const cancelRequests = await BookingModel.find({
      service: { $in: serviceIds },
      status: BookingStatus.TherapistCancelRequested
    })
    .populate('customer', 'name email phone')
    .populate({
      path: 'therapist',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .populate('service', 'name price duration description')
    .sort({ therapistCancelRequestedAt: -1 });

    // Format the response
    const formattedRequests = cancelRequests.map(booking => ({
      id: booking._id.toString(),
      displayId: `BKG-${booking._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        id: (booking.customer as any)._id.toString(),
        name: (booking.customer as any).name,
        email: (booking.customer as any).email,
        phone: (booking.customer as any).phone
      },
      therapist: {
        id: (booking.therapist as any)._id.toString(),
        name: (booking.therapist as any).user?.name || 'Unknown Therapist',
        email: (booking.therapist as any).user?.email || '',
        phone: (booking.therapist as any).user?.phone || ''
      },
      service: {
        id: (booking.service as any)._id.toString(),
        name: (booking.service as any).name,
        price: (booking.service as any).price,
        duration: (booking.service as any).duration
      },
      bookingDetails: {
        date: booking.date,
        time: booking.time,
        originalDate: booking.originalDate,
        originalTime: booking.originalTime
      },
      cancelRequest: {
        reason: booking.therapistCancelReason,
        requestedAt: booking.therapistCancelRequestedAt,
        reviewStatus: booking.businessReviewStatus
      },
      paymentInfo: {
        amount: booking.finalPrice || (booking.service as any)?.price || 0,
        advancePaid: (booking.finalPrice || (booking.service as any)?.price || 0) * 0.5,
        paymentStatus: booking.paymentStatus
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    return Response.json({
      success: true,
      message: 'Therapist cancel requests retrieved successfully',
      data: formattedRequests,
      counts: {
        total: formattedRequests.length,
        pending: formattedRequests.filter(r => r.cancelRequest.reviewStatus === 'pending').length,
        approved: formattedRequests.filter(r => r.cancelRequest.reviewStatus === 'approved').length,
        rejected: formattedRequests.filter(r => r.cancelRequest.reviewStatus === 'rejected').length
      }
    });

  } catch (error: any) {
    console.error('Error fetching therapist cancel requests:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
