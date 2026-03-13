import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import ReviewModel from '@/models/Review';
import TherapistBonusModel from '@/models/TherapistBonus';
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
          totalBookingEarnings: {
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

    // STEP 1B: Calculate total bonus earnings (only paid bonuses)
    const bonusSummary = await TherapistBonusModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: 'paid'
        } 
      },
      {
        $group: {
          _id: null,
          totalBonusEarnings: {
            $sum: { $ifNull: ['$bonusAmount', 0] }
          }
        }
      }
    ]);

    // Combine booking earnings and bonus earnings
    const bookingEarnings = bookingSummary[0]?.totalBookingEarnings || 0;
    const bonusEarnings = bonusSummary[0]?.totalBonusEarnings || 0;
    const totalEarnings = bookingEarnings + bonusEarnings;

    // STEP 2: Calculate average rating from reviews
    // Note: Review.therapist references User ID, not Therapist profile ID
    const reviewSummary = await ReviewModel.aggregate([
      { $match: { therapist: therapist.user } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // STEP 3: Monthly Earnings Trend (Bookings + Bonuses)
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
          bookingEarnings: {
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
          bookingEarnings: 1
        }
      }
    ]);

    // Get monthly bonus data (paid bonuses only)
    const monthlyBonusData = await TherapistBonusModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: 'paid'
        } 
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month'
          },
          bonusEarnings: {
            $sum: { $ifNull: ['$bonusAmount', 0] }
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
          bonusEarnings: 1
        }
      }
    ]);

    // Merge booking earnings and bonus earnings by month
    const earningsMap = new Map<string, number>();
    
    // Add booking earnings
    monthlyEarningsData.forEach(item => {
      earningsMap.set(item.month, item.bookingEarnings || 0);
    });
    
    // Add bonus earnings
    monthlyBonusData.forEach(item => {
      const current = earningsMap.get(item.month) || 0;
      earningsMap.set(item.month, current + (item.bonusEarnings || 0));
    });
    
    // Convert map back to array with combined earnings
    const monthlyEarnings = Array.from(earningsMap.entries())
      .map(([month, earnings]) => ({ month, earnings }))
      .sort((a, b) => a.month.localeCompare(b.month));

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
    // Note: Review.therapist references User ID, not Therapist profile ID
    const monthlyRatingsData = await ReviewModel.aggregate([
      { $match: { therapist: therapist.user } },
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
    // Note: Review.therapist references User ID, not Therapist profile ID
    const monthlyReviewCountData = await ReviewModel.aggregate([
      { $match: { therapist: therapist.user } },
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

    // STEP 8: Cancellation Analytics
    const cancellationData = await BookingModel.aggregate([
      { $match: { therapist: therapist._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', BookingStatus.Cancelled] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          cancelledBookings: 1,
          cancellationRate: {
            $multiply: [
              { $divide: ['$cancelledBookings', '$totalBookings'] },
              100
            ]
          }
        }
      }
    ]);

    // Monthly cancellation trend
    const monthlyCancellationData = await BookingModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: BookingStatus.Cancelled
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          cancellations: { $sum: 1 }
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
          cancellations: 1
        }
      }
    ]);

    // Cancellation reasons breakdown
    const cancellationReasonsData = await BookingModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          status: BookingStatus.Cancelled,
          'cancelRequest.reason': { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$cancelRequest.reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          reason: '$_id',
          count: 1
        }
      }
    ]);

    // Extract values with safe defaults
    const summary = bookingSummary[0] || { totalSessionsCompleted: 0, totalBookingEarnings: 0 };
    const reviewStats = reviewSummary[0] || { averageRating: 0, totalReviews: 0 };
    const cancellationStats = cancellationData[0] || { 
      totalBookings: 0, 
      cancelledBookings: 0, 
      cancellationRate: 0 
    };

    // Calculate monthly bonus earned (current month paid bonuses)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthBonuses = await TherapistBonusModel.aggregate([
      { $match: { 
          therapist: therapist._id,
          month: currentMonth,
          year: currentYear,
          status: 'paid'
        } 
      },
      {
        $group: {
          _id: null,
          monthlyBonus: {
            $sum: { $ifNull: ['$bonusAmount', 0] }
          }
        }
      }
    ]);
    const monthlyBonusEarned = currentMonthBonuses[0]?.monthlyBonus || 0;

    // Return clean JSON response
    return NextResponse.json({
      success: true,
      data: {
        totalSessionsCompleted: summary.totalSessionsCompleted || 0,
        totalEarnings: totalEarnings || 0,
        averageRating: Math.round((reviewStats.averageRating || 0) * 10) / 10,
        monthlyBonusEarned: monthlyBonusEarned || 0,
        monthlyEarnings: monthlyEarnings || [],
        monthlySessions: monthlySessionsData || [],
        monthlyRatings: monthlyRatingsData || [],
        serviceDistribution: serviceDistributionData || [],
        monthlyReviewCount: monthlyReviewCountData || [],
        // Cancellation analytics
        totalBookings: cancellationStats.totalBookings || 0,
        cancelledBookings: cancellationStats.cancelledBookings || 0,
        cancellationRate: Math.round(cancellationStats.cancellationRate || 0),
        monthlyCancellations: monthlyCancellationData || [],
        cancellationReasons: cancellationReasonsData || []
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
