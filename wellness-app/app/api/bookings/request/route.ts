import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import UserModel, { IUser } from '@/models/User';
import ServiceModel, { IService } from '@/models/Service';
import TherapistModel, { ITherapist } from '@/models/Therapist';
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
    } catch (verificationError: unknown) {
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
    const { businessId, serviceId, therapistId, date, startTime } = body;

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
      status: 'pending',
      notificationDestination: 'customer' // Default to customer notifications for direct bookings
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
    if (populatedBooking && !(populatedBooking.customer as IUser).phone) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (populatedBooking.customer as IUser)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        (populatedBooking.customer as IUser).phone = customerProfile.phoneNumber;
      }
    }

    // Format the response
    const formattedBooking = {
      id: populatedBooking!._id.toString(),
      customer: {
        id: (populatedBooking!.customer as IUser)._id.toString(),
        name: (populatedBooking!.customer as IUser).name,
        email: (populatedBooking!.customer as IUser).email,
        phone: (populatedBooking!.customer as IUser).phone,
        firstName: (populatedBooking!.customer as IUser).name.split(' ')[0] || (populatedBooking!.customer as IUser).name,
        lastName: (populatedBooking!.customer as IUser).name.split(' ').slice(1).join(' ') || ''
      },
      service: {
        id: (populatedBooking!.service as IService)._id.toString(),
        name: (populatedBooking!.service as IService).name,
        price: (populatedBooking!.service as IService).price,
        duration: (populatedBooking!.service as IService).duration,
        description: (populatedBooking!.service as IService).description
      },
      therapist: {
        id: (populatedBooking!.therapist as ITherapist)._id.toString(),
        fullName: (populatedBooking!.therapist as ITherapist).fullName,
        professionalTitle: (populatedBooking!.therapist as ITherapist).professionalTitle
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

  } catch (error: unknown) {
    console.error('Error creating booking request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}