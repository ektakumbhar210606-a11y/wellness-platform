import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import ReviewModel from '@/models/Review';
import * as jwt from 'jsonwebtoken';
import { BookingStatus } from '@/models/Booking';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize therapist users
 */
async function requireTherapistAuth(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
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

    // Check user role - allow both 'Therapist' and 'therapist' for backward compatibility
    if (decoded.role.toLowerCase() !== 'therapist') {
      return {
        authenticated: false,
        error: 'Access denied. Therapist role required',
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
      user: decoded,
      userId: decoded.id
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
 * GET endpoint to retrieve therapist analytics data
 * Protected by therapist authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize the request
    const authResult = await requireTherapistAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.userId!;

    await connectToDatabase();

    // Find therapist profile by user ID
    const therapist = await TherapistModel.findOne({ user: userId });
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    const therapistId = therapist._id.toString();

    // STEP 1: Basic Summary - Aggregate bookings data
    const bookingSummary = await BookingModel.aggregate([
      { $match: { therapist: therapist._id } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      { $unwind: { path: '$serviceInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalSessionsCompleted: {
            $sum: { $cond: [{ $eq: ['$status', BookingStatus.Completed] }, 1, 0] }
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$status', BookingStatus.Completed] },
                { $ifNull: ['$therapistPayoutAmount', 0] },
                0
              ]
            }
          }
        }
      }
    ]);

    // STEP 2: Calculate average rating from reviews
    const reviewSummary = await ReviewModel.aggregate([
      { $match: { therapist: therapist._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // STEP 3: Monthly Earnings Trend
    const monthlyEarningsData = await BookingModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: BookingStatus.Completed
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          earnings: {
            $sum: { $ifNull: ['$therapistPayoutAmount', 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
              { $toString: '$_id.month' }
            ]
          },
          earnings: 1
        }
      }
    ]);

    // STEP 4: Completed Sessions Per Month
    const monthlySessionsData = await BookingModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: BookingStatus.Completed
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
              { $toString: '$_id.month' }
            ]
          },
          sessions: 1
        }
      }
    ]);

    // STEP 5: Rating Trend Per Month
    const monthlyRatingsData = await ReviewModel.aggregate([
      { $match: { therapist: therapist._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
              { $toString: '$_id.month' }
            ]
          },
          avgRating: { $round: ['$avgRating', 2] },
          reviewCount: 1
        }
      }
    ]);

    // STEP 6: Service Distribution
    const serviceDistributionData = await BookingModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: BookingStatus.Completed
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
      { $unwind: '$serviceInfo' },
      {
        $group: {
          _id: '$serviceInfo.name',
          totalSessions: { $sum: 1 }
        }
      },
      { $sort: { totalSessions: -1 } },
      {
        $project: {
          _id: 0,
          serviceName: '$_id',
          totalSessions: 1
        }
      }
    ]);

    // STEP 7: Monthly Reviews Count
    const monthlyReviewCountData = await ReviewModel.aggregate([
      { $match: { therapist: therapist._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          reviewCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
              { $toString: '$_id.month' }
            ]
          },
          reviewCount: 1
        }
      }
    ]);

    // Extract values with safe defaults
    const summary = bookingSummary[0] || { totalSessionsCompleted: 0, totalEarnings: 0 };
    const reviewStats = reviewSummary[0] || { averageRating: 0, totalReviews: 0 };

    // Calculate monthly bonus (placeholder - no Bonus model exists)
    const monthlyBonusEarned = 0;

    // Return clean JSON response
    return NextResponse.json({
      success: true,
      data: {
        totalSessionsCompleted: summary.totalSessionsCompleted || 0,
        totalEarnings: summary.totalEarnings || 0,
        averageRating: Math.round((reviewStats.averageRating || 0) * 10) / 10,
        monthlyBonusEarned,
        monthlyEarnings: monthlyEarningsData || [],
        monthlySessions: monthlySessionsData || [],
        monthlyRatings: monthlyRatingsData || [],
        serviceDistribution: serviceDistributionData || [],
        monthlyReviewCount: monthlyReviewCountData || []
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching therapist analytics:', error);
    const errorMessage = (error instanceof Error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
