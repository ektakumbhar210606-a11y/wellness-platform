import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';
import TherapistModel from '@/models/Therapist';
import ServiceModel from '@/models/Service';
import UserModel from '@/models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

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
 * GET endpoint to retrieve customer analytics data
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

    await connectToDatabase();

    // Use MongoDB aggregation pipeline for efficient analytics calculation
    const analyticsData = await BookingModel.aggregate([
      // Match all bookings for this customer
      {
        $match: {
          customer: new Types.ObjectId(customerId)
        }
      },
      // Lookup therapist details
      {
        $lookup: {
          from: 'therapists',
          localField: 'therapist',
          foreignField: '_id',
          as: 'therapistInfo'
        }
      },
      {
        $unwind: {
          path: '$therapistInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup service details
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceInfo'
        }
      },
      {
        $unwind: {
          path: '$serviceInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      // Group to calculate all metrics
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalCompletedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          serviceBreakdown: {
            $push: {
              serviceName: { $ifNull: ['$serviceInfo.name', 'Unknown Service'] }
            }
          },
          therapistBreakdown: {
            $push: {
              therapistId: '$therapist',
              therapistName: { $ifNull: ['$therapistInfo.fullName', 'Unknown Therapist'] }
            }
          },
          bookingDetails: {
            $push: {
              status: '$status',
              servicePrice: { $ifNull: ['$serviceInfo.price', 0] },
              date: '$date',
              dayOfWeek: { $dayOfWeek: '$date' }, // 1-7 (Sunday = 1)
              dayOfMonth: { $dayOfMonth: '$date' }, // 1-31
              month: { $dateToString: { format: '%Y-%m', date: '$date' } },
              cancelRequest: '$cancelRequest',
              therapistCancelReason: '$therapistCancelReason',
              businessCancelReason: '$businessCancelReason'
            }
          },
          monthlySpendingData: {
            $push: {
              status: '$status',
              servicePrice: { $ifNull: ['$serviceInfo.price', 0] },
              month: { $dateToString: { format: "%Y-%m", date: '$date' } }
            }
          }
        }
      },
      // Project final format
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          totalCompletedBookings: 1,
          serviceBreakdown: 1,
          therapistBreakdown: 1,
          bookingDetails: 1,
          monthlySpendingData: 1
        }
      }
    ]);

    // Handle case when no bookings exist
    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({
        totalBookings: 0,
        totalCompletedBookings: 0,
        totalSpent: 0,
        mostBookedService: null,
        serviceBreakdown: [],
        therapistBreakdown: [],
        monthlyBookings: []
      });
    }

    const result = analyticsData[0];

    // Calculate total spent from completed bookings using service prices
    let totalSpent = 0;
    const bookingDates: Date[] = [];
    
    result.bookingDetails.forEach((detail: any) => {
      if (detail.status === 'completed') {
        totalSpent += detail.servicePrice || 0;
      }
      if (detail.date) {
        bookingDates.push(new Date(detail.date));
      }
    });

    // Calculate daily bookings pattern (by day of week)
    const dailyBookingsMap = new Map<number, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    result.bookingDetails.forEach((detail: any) => {
      const dayIndex = detail.dayOfWeek - 1; // Convert to 0-6 index
      dailyBookingsMap.set(dayIndex, (dailyBookingsMap.get(dayIndex) || 0) + 1);
    });

    const dailyBookings = dayNames.map((day, index) => ({
      day,
      count: dailyBookingsMap.get(index) || 0
    }));

    // Calculate daily bookings trend (by date)
    const dailyTrendMap = new Map<string, { date: string; count: number; spending: number }>();
    result.bookingDetails.forEach((detail: any) => {
      const dateKey = detail.date ? new Date(detail.date).toISOString().split('T')[0] : null;
      if (dateKey) {
        const existing = dailyTrendMap.get(dateKey) || { date: dateKey, count: 0, spending: 0 };
        existing.count += 1;
        if (detail.status === 'completed') {
          existing.spending += detail.servicePrice || 0;
        }
        dailyTrendMap.set(dateKey, existing);
      }
    });

    const dailyTrend = Array.from(dailyTrendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cancellation analytics - specifically therapist-initiated cancellations
    const cancelledBookings = result.bookingDetails.filter((detail: any) => 
      detail.status === 'cancelled'
    ).length;

    // Track therapist-initiated cancellations specifically
    const therapistCancelledBookings = result.bookingDetails.filter((detail: any) => 
      detail.status === 'cancelled' && detail.therapistCancelReason
    ).length;

    // Monthly cancellation trend - therapist-initiated only
    const monthlyCancellationMap = new Map<string, number>();
    if (result.bookingDetails && Array.isArray(result.bookingDetails)) {
      result.bookingDetails.forEach((item: any) => {
        // Only count cancellations where therapist initiated (has therapistCancelReason)
        if (item.status === 'cancelled' && item.therapistCancelReason) {
          const current = monthlyCancellationMap.get(item.month) || 0;
          monthlyCancellationMap.set(item.month, current + 1);
        }
      });
    }

    const monthlyCancellations = Array.from(monthlyCancellationMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Cancellation reasons breakdown - specifically from therapistCancelReason field
    const reasonCountMap = new Map<string, number>();
    if (result.bookingDetails && Array.isArray(result.bookingDetails)) {
      result.bookingDetails.forEach((item: any) => {
        // Only use therapistCancelReason field, not generic cancelRequest.reason
        if (item.status === 'cancelled' && item.therapistCancelReason) {
          const reason = item.therapistCancelReason;
          const current = reasonCountMap.get(reason) || 0;
          reasonCountMap.set(reason, current + 1);
        }
      });
    }

    const cancellationReasons = Array.from(reasonCountMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate cancellation rate based on therapist-initiated cancellations
    const cancellationRate = result.totalBookings > 0 
      ? ((therapistCancelledBookings / result.totalBookings) * 100).toFixed(1) 
      : '0.0';

    // Process service breakdown - count occurrences
    const serviceCountMap = new Map<string, number>();
    result.serviceBreakdown.forEach((item: any) => {
      const serviceName = item.serviceName;
      serviceCountMap.set(serviceName, (serviceCountMap.get(serviceName) || 0) + 1);
    });

    const serviceBreakdown = Array.from(serviceCountMap.entries()).map(([service, count]) => ({
      service,
      count
    })).sort((a, b) => b.count - a.count);

    // Find most booked service
    const mostBookedService = serviceBreakdown.length > 0 ? serviceBreakdown[0].service : null;

    // Process therapist breakdown - count sessions per therapist
    const therapistCountMap = new Map<string, { count: number; name: string }>();
    result.therapistBreakdown.forEach((item: any) => {
      const therapistName = item.therapistName;
      if (!therapistCountMap.has(therapistName)) {
        therapistCountMap.set(therapistName, { count: 0, name: therapistName });
      }
      therapistCountMap.get(therapistName)!.count++;
    });

    const therapistBreakdown = Array.from(therapistCountMap.values())
      .map(({ name, count }) => ({ therapistName: name, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate monthly bookings
    const monthlyCountMap = new Map<string, number>();
    bookingDates.forEach((date: Date) => {
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyCountMap.set(monthKey, (monthlyCountMap.get(monthKey) || 0) + 1);
    });

    const monthlyBookings = Array.from(monthlyCountMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate monthly spending from completed bookings
    const monthlySpendingMap = new Map<string, number>();
    result.monthlySpendingData.forEach((detail: any) => {
      if (detail.status === 'completed') {
        const current = monthlySpendingMap.get(detail.month) || 0;
        monthlySpendingMap.set(detail.month, current + (detail.servicePrice || 0));
      }
    });

    const monthlySpending = Array.from(monthlySpendingMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Return clean JSON response with all analytics
    return NextResponse.json({
      totalBookings: result.totalBookings,
      totalCompletedBookings: result.totalCompletedBookings,
      totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimal places
      mostBookedService,
      serviceBreakdown,
      therapistBreakdown,
      monthlyBookings,
      monthlySpending,
      dailyBookings,
      dailyTrend,
      // Cancellation analytics
      cancelledBookings,
      cancellationRate: parseFloat(cancellationRate),
      monthlyCancellations,
      cancellationReasons
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching customer analytics:', error);
    
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
