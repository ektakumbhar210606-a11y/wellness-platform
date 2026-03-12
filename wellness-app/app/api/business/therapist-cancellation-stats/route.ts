import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BusinessModel from '@/models/Business';
import TherapistModel from '@/models/Therapist';
import BookingModel, { BookingStatus } from '@/models/Booking';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

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
    } catch (err) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Check user role - allow both 'Business' and 'Provider' roles
    const userRole = decoded.role.toLowerCase();
    if (userRole !== 'business' && userRole !== 'provider') {
      return {
        authenticated: false,
        error: 'Access denied. Business or Provider role required',
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

/**
 * GET /api/business/therapist-cancellation-stats
 * Get cancellation statistics for all therapists associated with the business
 */
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

    // Find all therapists associated with this business (approved only)
    const therapists = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id,
      'associatedBusinesses.status': 'approved'
    }).populate('user', 'firstName lastName');

    // Build statistics for each therapist
    const stats = await Promise.all(
      therapists.map(async (therapist) => {
        // Count completed bookings for this therapist
        const completedBookingsCount = await BookingModel.countDocuments({
          therapist: therapist._id,
          status: BookingStatus.Completed
        });

        // Get therapist name
        const therapistName = therapist.fullName || 
          `${(therapist.user as any)?.firstName || ''} ${(therapist.user as any)?.lastName || ''}`.trim() ||
          'Unknown Therapist';

        return {
          therapistName,
          completedBookings: completedBookingsCount,
          monthlyCancelCount: therapist.monthlyCancelCount || 0,
          totalCancelCount: therapist.totalCancelCount || 0,
          cancelWarnings: therapist.cancelWarnings || 0,
          bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0
        };
      })
    );

    return Response.json({
      success: true,
      message: 'Therapist cancellation statistics retrieved successfully',
      data: stats
    });

  } catch (error: any) {
    console.error('Error retrieving therapist cancellation statistics:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
