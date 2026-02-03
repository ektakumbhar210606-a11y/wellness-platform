import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BusinessModel from '@/models/Business';
import BookingModel from '@/models/Booking';
import ReviewModel from '@/models/Review';
import ServiceModel from '@/models/Service';
import jwt from 'jsonwebtoken';

// Define the structure of the decoded JWT payload
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Helper function to authenticate and authorize business user requests
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
    const userModule = await import('@/models/User');
    const UserModel = userModule.default;
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
 * GET endpoint to retrieve business dashboard statistics
 * Protected by business authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize the request
    const authResult = await requireBusinessAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const businessOwnerId = user.id;

    // Find the business owned by this user
    const business = await BusinessModel.findOne({ owner: businessOwnerId });
    if (!business) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const businessId = business._id;

    // Fetch all required statistics in parallel for better performance
    const [
      totalClients,
      upcomingAppointments,
      avgRating,
      totalRevenue,
      totalServices,
      pendingTherapistRequests
    ] = await Promise.all([
      // 1. Total unique clients who have booked services (only confirmed/completed bookings)
      BookingModel.distinct('customer', { 
        business: businessId,
        status: { $in: ['completed', 'confirmed'] }
      }).then(clients => clients.length),

      // 2. Upcoming appointments (only confirmed bookings with future dates)
      BookingModel.countDocuments({
        business: businessId,
        status: 'confirmed',
        date: { $gte: new Date() }
      }),

      // 3. Average rating from customer reviews
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
            'bookingInfo.business': businessId
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]),

      // 4. Total revenue from completed bookings (assuming price field exists)
      BookingModel.aggregate([
        {
          $match: {
            business: businessId,
            status: 'completed'
          }
        },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceInfo'
          }
        },
        {
          $unwind: '$serviceInfo'
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$serviceInfo.price' } }
          }
        }
      ]),

      // 5. Total services offered by this business
      ServiceModel.countDocuments({ business: businessId }),

      // 6. Pending therapist requests
      BusinessModel.aggregate([
        { $match: { _id: businessId } },
        {
          $project: {
            pendingRequests: {
              $size: {
                $filter: {
                  input: '$therapists',
                  cond: { $eq: ['$$this.status', 'pending'] }
                }
              }
            }
          }
        }
      ])
    ]);

    // Handle average rating - if no reviews exist, return 0
    const averageRating = avgRating.length > 0 && avgRating[0].totalReviews > 0 
      ? Math.round(avgRating[0].avgRating * 10) / 10 // Round to 1 decimal place
      : 0;

    // Handle total revenue - if no bookings, return 0
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;

    // Handle pending requests - extract the count
    const pendingRequests = pendingTherapistRequests.length > 0 
      ? pendingTherapistRequests[0].pendingRequests 
      : 0;

    // Return clean JSON response with all statistics
    return NextResponse.json({
      totalClients: totalClients,
      upcomingAppointments: upcomingAppointments,
      avgRating: averageRating,
      totalRevenue: revenue,
      totalServices: totalServices,
      pendingTherapistRequests: pendingRequests
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching business dashboard stats:', error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}