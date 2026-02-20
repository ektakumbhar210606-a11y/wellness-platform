import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { JwtPayload } from '@/lib/middleware/authMiddleware';
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

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
    const { bookingId, amount, currency = 'INR' } = body;

    // Validate required fields
    if (!bookingId || !amount) {
      return Response.json(
        { success: false, error: 'Booking ID and amount are required' },
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

    // Validate amount matches expected therapist payment amount
    // Use the stored therapistPayoutAmount if available, otherwise calculate 40% of service price
    const service = await ServiceModel.findById(booking.service);
    if (!service) {
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const expectedTherapistPayout = booking.therapistPayoutAmount || (service.price * 0.4);
    const expectedAmount = Math.round(expectedTherapistPayout * 100); // Convert to paise
    
    if (amount !== expectedAmount) {
      return Response.json(
        { 
          success: false, 
          error: `Invalid amount. Expected: ₹${expectedTherapistPayout.toFixed(2)}, got: ₹${(amount/100).toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: amount.toString(), // Amount in paise
      currency: currency,
      receipt: `booking_${bookingId}_therapist_payout`,
      notes: {
        bookingId: bookingId,
        businessId: decoded.id,
        therapistId: booking.therapist._id.toString(),
        purpose: 'therapist_payout'
      }
    };

    const order = await razorpayInstance.orders.create(options);

    // Update booking with order information
    await BookingModel.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          therapistPayoutOrderInfo: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            created_at: new Date(order.created_at * 1000) // Convert Unix timestamp to Date
          }
        }
      }
    );

    return Response.json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}