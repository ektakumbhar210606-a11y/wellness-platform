import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import BusinessModel from '../../../../models/Business';
import ServiceModel from '../../../../models/Service';
import TherapistModel from '../../../../models/Therapist';
import UserModel from '../../../../models/User';
import ReviewModel from '../../../../models/Review';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize business users
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
    } catch (verificationError: unknown) {
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize business user
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

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Get all services for this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map(s => s._id);

    // Use MongoDB aggregation pipeline for efficient analytics calculation
    const analyticsData = await BookingModel.aggregate([
      {
        $match: {
          service: { $in: serviceIds }
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
      // Lookup customer details
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: {
          path: '$customerInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      // Group to calculate all metrics
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: { $ifNull: ['$serviceInfo.price', 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          serviceBreakdown: {
            $push: {
              serviceName: { $ifNull: ['$serviceInfo.name', 'Unknown Service'] },
              serviceId: '$service'
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
              serviceId: '$service',
              therapistId: '$therapist',
              status: '$status',
              servicePrice: { $ifNull: ['$serviceInfo.price', 0] },
              date: '$date',
              dayOfWeek: { $dayOfWeek: '$date' },
              month: { $dateToString: { format: '%Y-%m', date: '$date' } },
              paymentStatus: '$paymentStatus'
            }
          }
        }
      }
    ]);

    if (!analyticsData || analyticsData.length === 0) {
      return Response.json({
        success: true,
        data: {
          totalBookings: 0,
          totalRevenue: 0,
          completedBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          averageRating: 0,
          serviceBreakdown: [],
          therapistBreakdown: [],
          monthlyRevenue: [],
          monthlyBookings: [],
          dailyBookings: [],
          servicePerformance: [],
          therapistPerformance: [],
          recentReviews: []
        }
      });
    }

    const result = analyticsData[0];

    // Process service breakdown - group by service and count
    const serviceCountMap = new Map<string, { name: string; count: number; revenue: number }>();
    result.serviceBreakdown.forEach((item: any) => {
      const existing = serviceCountMap.get(item.serviceName);
      if (existing) {
        existing.count += 1;
      } else {
        serviceCountMap.set(item.serviceName, { name: item.serviceName, count: 1, revenue: 0 });
      }
    });

    // Calculate revenue per service
    result.bookingDetails.forEach((detail: any) => {
      if (!detail.serviceId) return; // Skip if no service ID
      
      const serviceName = result.serviceBreakdown.find((sb: any) => 
        sb.serviceId?.toString() === detail.serviceId?.toString()
      )?.serviceName || 'Unknown Service';
      
      const service = serviceCountMap.get(serviceName);
      if (service) {
        service.revenue += detail.servicePrice || 0;
      }
    });

    const servicePerformance = Array.from(serviceCountMap.values()).map(service => ({
      serviceName: service.name,
      bookings: service.count,
      revenue: service.revenue
    }));

    // Process therapist breakdown - group by therapist and count sessions
    const therapistCountMap = new Map<string, { name: string; count: number; revenue: number }>();
    result.therapistBreakdown.forEach((item: any) => {
      if (item.therapistId) {
        const existing = therapistCountMap.get(item.therapistName);
        if (existing) {
          existing.count += 1;
        } else {
          therapistCountMap.set(item.therapistName, { name: item.therapistName, count: 1, revenue: 0 });
        }
      }
    });

    // Calculate revenue per therapist
    result.bookingDetails.forEach((detail: any) => {
      if (!detail.therapistId) return; // Skip if no therapist ID
      
      const therapistInfo = result.therapistBreakdown.find((tb: any) => 
        tb.therapistId?.toString() === detail.therapistId?.toString()
      );
      
      if (therapistInfo) {
        const therapist = therapistCountMap.get(therapistInfo.therapistName);
        if (therapist) {
          therapist.revenue += detail.servicePrice || 0;
        }
      }
    });

    const therapistPerformance = Array.from(therapistCountMap.values()).map(therapist => ({
      therapistName: therapist.name,
      sessions: therapist.count,
      revenue: therapist.revenue
    }));

    // Process monthly revenue and bookings
    const monthlyRevenueMap = new Map<string, number>();
    const monthlyBookingsMap = new Map<string, number>();
    
    result.bookingDetails.forEach((detail: any) => {
      const month = detail.month;
      const currentRevenue = monthlyRevenueMap.get(month) || 0;
      const currentBookings = monthlyBookingsMap.get(month) || 0;
      
      monthlyRevenueMap.set(month, currentRevenue + (detail.servicePrice || 0));
      monthlyBookingsMap.set(month, currentBookings + 1);
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const monthlyBookings = Array.from(monthlyBookingsMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Process daily bookings (last 30 days)
    const dailyBookingsMap = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    result.bookingDetails.forEach((detail: any) => {
      const bookingDate = new Date(detail.date);
      if (bookingDate >= thirtyDaysAgo) {
        const dateStr = detail.date.toISOString().split('T')[0];
        const current = dailyBookingsMap.get(dateStr) || 0;
        dailyBookingsMap.set(dateStr, current + 1);
      }
    });

    const dailyBookings = Array.from(dailyBookingsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get reviews for business therapists
    const approvedTherapists = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id,
      'associatedBusinesses.status': 'approved'
    }).select('user');

    const therapistUserIds = approvedTherapists.map(t => t.user);

    let recentReviews: {
      therapistName: string;
      customerName: string;
      serviceName: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }[] = [];
    let averageRating = 0;

    if (therapistUserIds.length > 0) {
      const reviews = await ReviewModel.find({
        therapist: { $in: therapistUserIds }
      })
        .populate({
          path: 'therapist',
          select: 'firstName lastName fullName email'
        })
        .populate({
          path: 'customer',
          select: 'firstName lastName name'
        })
        .populate({
          path: 'service',
          select: 'name'
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      recentReviews = await Promise.all(reviews.map(async (review) => {
        const therapistUser = review.therapist as any;
        let therapistFullName = 'Unknown Therapist';
        
        if (therapistUser && therapistUser._id) {
          try {
            // Try to find TherapistProfile by userId
            const TherapistProfileModel = (await import('@/models/TherapistProfile')).TherapistProfile;
            const therapistProfile = await TherapistProfileModel.findOne({ userId: therapistUser._id }).lean();
            
            if (therapistProfile && therapistProfile.fullName) {
              therapistFullName = therapistProfile.fullName.trim();
            } else {
              // Fallback to User fields if TherapistProfile not found
              if (therapistUser.firstName && therapistUser.lastName) {
                therapistFullName = `${therapistUser.firstName} ${therapistUser.lastName}`.trim();
              } else if (therapistUser.fullName) {
                therapistFullName = therapistUser.fullName.trim();
              } else if (therapistUser.firstName) {
                therapistFullName = therapistUser.firstName;
              } else if (therapistUser.lastName) {
                therapistFullName = therapistUser.lastName;
              } else if (therapistUser.email) {
                therapistFullName = therapistUser.email.split('@')[0];
              }
            }
          } catch (error) {
            console.error('Error fetching therapist profile:', error);
            // Use fallback logic if TherapistProfile fetch fails
            if (therapistUser.firstName && therapistUser.lastName) {
              therapistFullName = `${therapistUser.firstName} ${therapistUser.lastName}`.trim();
            } else if (therapistUser.fullName) {
              therapistFullName = therapistUser.fullName.trim();
            } else if (therapistUser.firstName) {
              therapistFullName = therapistUser.firstName;
            } else if (therapistUser.lastName) {
              therapistFullName = therapistUser.lastName;
            } else if (therapistUser.email) {
              therapistFullName = therapistUser.email.split('@')[0];
            }
          }
        }

        return {
          therapistName: therapistFullName,
          customerName: (review.customer && ((review.customer as any)?.firstName || (review.customer as any)?.lastName)) 
            ? `${(review.customer as any)?.firstName || ''} ${(review.customer as any)?.lastName || ''}`.trim()
            : ((review.customer as any)?.name || 'Anonymous Customer'),
          serviceName: (review.service as any)?.name || 'Unknown Service',
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        };
      }));

      // Calculate average rating
      const allReviews = await ReviewModel.find({
        therapist: { $in: therapistUserIds }
      }).select('rating').lean();

      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        averageRating = totalRating / allReviews.length;
      }
    }

    // Return clean JSON response with all analytics
    return Response.json({
      success: true,
      data: {
        totalBookings: result.totalBookings || 0,
        totalRevenue: result.totalRevenue || 0,
        completedBookings: result.completedBookings || 0,
        confirmedBookings: result.confirmedBookings || 0,
        cancelledBookings: result.cancelledBookings || 0,
        pendingBookings: result.pendingBookings || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        servicePerformance,
        therapistPerformance,
        monthlyRevenue,
        monthlyBookings,
        dailyBookings,
        recentReviews
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching business analytics:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
