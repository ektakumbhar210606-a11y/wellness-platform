import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel from '../../../../../models/Booking';
import ReviewModel from '../../../../../models/Review';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

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
 * GET endpoint to retrieve customer dashboard statistics
 * Protected by customer authentication
 */
export async function GET(request: NextRequest) {
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

    // Fetch all required statistics in parallel for better performance
    const [
      totalAppointments,
      upcomingAppointments,
      completedServices,
      avgRating
    ] = await Promise.all([
      // 1. Total appointments count (only confirmed/completed bookings - business confirmed)
      BookingModel.countDocuments({ 
        customer: customerId,
        status: { $in: ['confirmed', 'completed'] }
      }),

      // 2. Upcoming appointments count (only confirmed bookings with future dates)
      BookingModel.countDocuments({
        customer: customerId,
        status: 'confirmed',
        date: { $gte: new Date() }
      }),

      // 3. Services used count (completed bookings)
      BookingModel.countDocuments({
        customer: customerId,
        status: 'completed'
      }),

      // 4. Average rating given by customer (from reviews)
      ReviewModel.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'bookingInfo'
          }
        },
        {
          $match: {
            'bookingInfo.customer': customerId
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ]);

    // Handle average rating - if no reviews exist, return 0
    const averageRating = avgRating.length > 0 && avgRating[0].totalReviews > 0 
      ? Math.round(avgRating[0].avgRating * 10) / 10 // Round to 1 decimal place
      : 0;

    // Return clean JSON response with all statistics
    return NextResponse.json({
      appointments: totalAppointments,
      upcomingAppointments: upcomingAppointments,
      servicesUsed: completedServices,
      avgRating: averageRating
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching customer dashboard stats:', error);
    
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}