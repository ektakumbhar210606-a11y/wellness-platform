import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { JwtPayload } from '@/lib/middleware/authMiddleware';
import crypto from 'crypto';

// Require business authentication
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

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { bookingId } = body;

    // Validate bookingId
    if (!bookingId) {
      return Response.json(
        { success: false, error: 'Booking ID is required' },
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

    // Find the booking
    const booking = await BookingModel.findById(bookingId)
      .populate('therapist')
      .populate('service');
      
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is completed and paid
    if (booking.status !== 'completed' || booking.paymentStatus !== 'paid') {
      return Response.json(
        { 
          success: false, 
          error: 'Booking must be completed and fully paid before paying therapist' 
        },
        { status: 400 }
      );
    }

    // Get therapist details
    const therapist = await TherapistModel.findById(booking.therapist);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Get service details to calculate payment amount
    const service = await ServiceModel.findById(booking.service);
    if (!service) {
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Calculate 40% of the service amount as payment to therapist
    const therapistPaymentAmount = service.price * 0.4;

    // Prepare payment details for frontend
    const paymentDetails = {
      bookingId: booking._id.toString(),
      therapistName: therapist.name,
      therapistContact: therapist.contactNumber,
      therapistPaymentAmount: therapistPaymentAmount,
      serviceName: service.name,
      servicePrice: service.price,
      businessId: decoded.id,
      bookingDate: booking.date,
      bookingTime: booking.time
    };

    return Response.json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: paymentDetails
    });
  } catch (error: any) {
    console.error('Error retrieving payment details:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle Razorpay payment confirmation
export async function PUT(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    // Validate required fields
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return Response.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature here (implement signature verification)
    // This is a simplified version - you should implement proper signature verification
    
    // Find the booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify the payment with Razorpay
    
    // Create the signature verification string
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');
    
    // Compare signatures
    if (expectedSignature !== razorpaySignature) {
      return Response.json(
        { success: false, error: 'Payment verification failed. Signature mismatch.' },
        { status: 400 }
      );
    }
    
    // Update booking to mark therapist payout as paid
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      {
        therapistPayoutStatus: 'paid',
        therapistPayoutAmount: booking.therapistPayoutAmount,
        therapistPaidAt: new Date(),
        // Add payment verification details
        paymentVerification: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          verifiedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return Response.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Therapist payment processed successfully',
      data: {
        bookingId: updatedBooking._id.toString(),
        therapistPayoutStatus: updatedBooking.therapistPayoutStatus,
        therapistPaidAt: updatedBooking.therapistPaidAt
      }
    });
  } catch (error: any) {
    console.error('Error processing therapist payment:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}