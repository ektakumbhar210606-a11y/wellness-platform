import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import UserModel from '@/models/User';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';
import BusinessModel from '@/models/Business';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Middleware to authenticate and authorize customer users
 */
async function requireCustomerAuth(request: NextRequest) {
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
 * POST endpoint to create a booking request
 * Protected by customer authentication
 */
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { businessId, serviceId, therapistId, date, startTime, endTime } = body;

    // Validate required fields
    if (!businessId || !serviceId || !therapistId || !date || !startTime) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: businessId, serviceId, therapistId, date, and startTime are required' 
        },
        { status: 400 }
      );
    }

    // Validate that the customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Validate that the service exists
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Validate that the therapist exists
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return NextResponse.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Validate that the business exists
    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if a booking already exists for this customer, service, therapist, and time
    const existingBooking = await BookingModel.findOne({
      customer: customerId,
      service: serviceId,
      therapist: therapistId,
      date: new Date(date),
      time: startTime
    });

    if (existingBooking) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A booking already exists for this time slot' 
        },
        { status: 409 }
      );
    }

    // Create the booking request with pending status
    const newBooking = new BookingModel({
      customer: customerId,
      service: serviceId,
      therapist: therapistId,
      date: new Date(date),
      time: startTime,
      status: 'pending'
    });

    const savedBooking = await newBooking.save();

    // Populate the booking with related data for the response
    const populatedBooking = await BookingModel.findById(savedBooking._id)
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
    if (populatedBooking && !populatedBooking.customer.phone) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: populatedBooking.customer._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        (populatedBooking.customer as any).phone = customerProfile.phoneNumber;
      }
    }

    // Format the response
    const formattedBooking = {
      id: populatedBooking!._id.toString(),
      customer: {
        id: (populatedBooking!.customer as any)._id.toString(),
        name: (populatedBooking!.customer as any).name,
        email: (populatedBooking!.customer as any).email,
        phone: (populatedBooking!.customer as any).phone,
        firstName: (populatedBooking!.customer as any).name.split(' ')[0] || (populatedBooking!.customer as any).name,
        lastName: (populatedBooking!.customer as any).name.split(' ').slice(1).join(' ') || ''
      },
      service: {
        id: (populatedBooking!.service as any)._id.toString(),
        name: (populatedBooking!.service as any).name,
        price: (populatedBooking!.service as any).price,
        duration: (populatedBooking!.service as any).duration,
        description: (populatedBooking!.service as any).description
      },
      therapist: {
        id: (populatedBooking!.therapist as any)._id.toString(),
        fullName: (populatedBooking!.therapist as any).fullName,
        professionalTitle: (populatedBooking!.therapist as any).professionalTitle
      },
      business: {
        id: businessId,
        name: business.business_name
      },
      date: populatedBooking!.date,
      time: populatedBooking!.time,
      status: populatedBooking!.status,
      createdAt: populatedBooking!.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Booking request sent successfully',
      data: formattedBooking
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating booking request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + error.message 
      },
      { status: 500 }
    );
  }
}