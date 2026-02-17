import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel from '../../../../../models/Booking';
import UserModel from '../../../../../models/User';
import ServiceModel from '../../../../../models/Service';
import TherapistModel from '../../../../../models/Therapist';
import BusinessModel from '../../../../../models/Business';
import * as jwt from 'jsonwebtoken';
import { formatBookingId } from '../../../../../utils/bookingIdFormatter';
import { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectToDatabase();
    
    // Force model registration
    await UserModel.findOne({});
    await ServiceModel.findOne({});
    await TherapistModel.findOne({});
    await BusinessModel.findOne({});
    
    // Get token and validate
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check user role
    if (decoded.role.toLowerCase() !== 'customer') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Customer role required' },
        { status: 403 }
      );
    }

    // Get user document
    const userDocument = await UserModel.findById(decoded.id);
    if (!userDocument) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Extract bookingId from params
    const awaitedParams = await params;
    const bookingId = awaitedParams.bookingId;

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    // Find and populate booking data
    const booking = await BookingModel.findById(bookingId)
      .populate({
        path: 'service',
        select: 'name price duration description business'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle email phone'
      })
      .populate({
        path: 'customer',
        select: 'firstName lastName email phone'
      });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking ownership - flexible ID comparison
    const bookingCustomerId = booking.customer?.toString() || '';
    const userDocumentId = userDocument._id.toString();
    const jwtUserId = decoded.id || '';
    
    const isAuthorized = (
      bookingCustomerId === userDocumentId || 
      bookingCustomerId === jwtUserId
    );
    
    if (!isAuthorized) {
      console.log('Authorization failed:');
      console.log('- Booking customer ID:', bookingCustomerId);
      console.log('- User document ID:', userDocumentId);
      console.log('- JWT user ID:', jwtUserId);
      return NextResponse.json(
        { success: false, error: 'Access denied. You can only view your own bookings.' },
        { status: 403 }
      );
    }

    // Populate business data
    let businessData = null;
    if (booking.service && (booking.service as any).business) {
      try {
        const business = await BusinessModel.findById((booking.service as any).business as Types.ObjectId)
          .select('name address currency country phone email')
          .lean();

        if (business) {
          businessData = {
            id: business._id.toString(),
            name: business.name,
            address: business.address,
            currency: business.currency,
            country: business.country,
            phone: business.phone,
            email: business.email
          };
        }
      } catch (error: unknown) {
        console.error('Error populating business data:', error);
      }
    }

    // Format response data
    const formattedBooking = {
      id: booking._id.toString(),
      displayId: formatBookingId(booking._id.toString()),
      service: booking.service ? {
        id: (booking.service as any)._id.toString(),
        name: (booking.service as any).name,
        price: (booking.service as any).price,
        duration: (booking.service as any).duration,
        description: (booking.service as any).description
      } : null,
      therapist: booking.therapist ? {
        id: (booking.therapist as any)._id.toString(),
        fullName: (booking.therapist as any).fullName,
        professionalTitle: (booking.therapist as any).professionalTitle,
        email: (booking.therapist as any).email,
        phone: (booking.therapist as any).phone
      } : null,
      business: businessData,
      customer: booking.customer ? {
        id: (booking.customer as any)._id.toString(),
        firstName: (booking.customer as any).firstName,
        lastName: (booking.customer as any).lastName,
        email: (booking.customer as any).email,
        phone: (booking.customer as any).phone
      } : null,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      originalDate: booking.originalDate,
      originalTime: booking.originalTime,
      hasBeenRescheduled: !!booking.originalDate || !!booking.originalTime,
      paymentStatus: booking.paymentStatus || 'pending',
      specialRequests: booking.specialRequests || '',
      cancellationReason: booking.cancellationReason || null
    };

    return NextResponse.json({
      success: true,
      data: formattedBooking
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching booking details:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}