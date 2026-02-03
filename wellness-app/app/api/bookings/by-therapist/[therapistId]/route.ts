import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import BusinessModel from '@/models/Business';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';
import { Types } from 'mongoose';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ therapistId: string }> }
) {
  try {
    // Authenticate and authorize business user
    const authResult = await requireBusinessAuth(request);
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

    // Extract therapistId from params (await the promise)
    const awaitedParams = await params;
    const therapistId = awaitedParams.therapistId;
    
    // Debug logging
    console.log('Received params:', awaitedParams);
    console.log('Extracted therapistId:', therapistId);
    
    // Validate therapist ID format
    if (!therapistId) {
      console.error('Therapist ID is empty or undefined:', { awaitedParams: awaitedParams, therapistId: therapistId });
      return Response.json(
        { success: false, error: 'Therapist ID is required' },
        { status: 400 }
      );
    }
    
    if (!Types.ObjectId.isValid(therapistId)) {
      console.error(`Invalid therapist ID format: ${therapistId}`);
      return Response.json(
        { success: false, error: `Invalid therapist ID format: ${therapistId}` },
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
    
    // Verify therapist exists and is associated with this business
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Check if therapist is associated with the business
    const isTherapistAssociated = therapist.associatedBusinesses?.some(
      (assoc: any) => 
        assoc.businessId.toString() === business._id.toString() && 
        assoc.status === 'approved'
    );

    if (!isTherapistAssociated) {
      return Response.json(
        { success: false, error: 'Therapist is not approved for this business' },
        { status: 400 }
      );
    }
    
    // Find services associated with this business
    const businessServices = await ServiceModel.find({ business: business._id }).select('_id').lean();
    const serviceIds = businessServices.map((service: any) => service._id);
    
    // Find bookings that have a service from this business and the specific therapist assigned with pending status
    // These would be customer booking requests where the therapist was specifically selected
    const bookings = await BookingModel.find({
      service: { $in: serviceIds },
      therapist: therapistId,
      status: BookingStatus.Pending
    })
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
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format the bookings for response
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
      time: booking.time,
      status: booking.status,
      createdAt: booking.createdAt
    }));

    return Response.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: formattedBookings
    });

  } catch (error: any) {
    console.error('Error fetching bookings by therapist:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}