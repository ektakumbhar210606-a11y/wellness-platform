import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import ReviewModel from '../../../../models/Review';
import BusinessModel from '../../../../models/Business';
import TherapistModel from '../../../../models/Therapist';
import UserModel from '../../../../models/User';
import ServiceModel from '../../../../models/Service';
import * as jwt from 'jsonwebtoken';
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

/**
 * GET endpoint to fetch all reviews for therapists associated with the authenticated business
 * Allows optional filtering by therapistId
 * Returns reviews sorted by newest first
 * 
 * Query Parameters:
 * - therapistId (optional): Filter reviews for a specific therapist
 * 
 * @param req - NextRequest object
 * @returns Response with reviews data
 */
export async function GET(req: NextRequest) {
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

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const therapistId = searchParams.get('therapistId');

    // Validate therapistId if provided
    if (therapistId && !/^[0-9a-fA-F]{24}$/.test(therapistId)) {
      return Response.json(
        { success: false, error: 'Invalid therapist ID format' },
        { status: 400 }
      );
    }

    // If therapistId is provided, verify the therapist is associated with this business
    if (therapistId) {
      const therapist = await TherapistModel.findById(therapistId);
      if (!therapist) {
        return Response.json(
          { success: false, error: 'Therapist not found' },
          { status: 404 }
        );
      }

      const isTherapistAssociated = therapist.associatedBusinesses?.some(
        (assoc: any) => 
          assoc.businessId.toString() === business._id.toString() && 
          assoc.status === 'approved'
      );

      if (!isTherapistAssociated) {
        return Response.json(
          { success: false, error: 'Therapist is not approved for this business' },
          { status: 403 }
        );
      }
    }

    // Get approved therapists for this business
    const approvedTherapists = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id,
      'associatedBusinesses.status': 'approved'
    }).select('user');

    const therapistUserIds = approvedTherapists.map(t => t.user);

    // If no approved therapists, return empty array
    if (therapistUserIds.length === 0) {
      return Response.json({
        success: true,
        data: {
          reviews: [],
          totalCount: 0
        }
      });
    }

    // Build query filter - use user IDs since Review.therapist references User IDs
    const filter: any = {
      therapist: { $in: therapistUserIds }
    };

    // Apply therapistId filter if provided
    if (therapistId) {
      // Validate that the provided therapistId belongs to an approved therapist for this business
      const therapist = await TherapistModel.findOne({
        _id: therapistId,
        'associatedBusinesses.businessId': business._id,
        'associatedBusinesses.status': 'approved'
      });
      
      if (!therapist) {
        return Response.json(
          { success: false, error: 'Therapist is not approved for this business' },
          { status: 403 }
        );
      }
      
      filter.therapist = therapist.user;
    }

    // Fetch reviews with populated data
    const reviews = await ReviewModel.find(filter)
      .populate({
        path: 'therapist',
        select: 'fullName user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'customer',
        select: 'firstName lastName'
      })
      .populate({
        path: 'service',
        select: 'name'
      })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    // Transform reviews data to match required response format
    const formattedReviews = reviews.map(review => ({
      therapistName: (review.therapist as any)?.fullName || 
                    `${(review.therapist as any)?.user?.firstName || ''} ${(review.therapist as any)?.user?.lastName || ''}`.trim() || 
                    'Unknown Therapist',
      customerName: `${(review.customer as any)?.firstName || ''} ${(review.customer as any)?.lastName || ''}`.trim() || 'Anonymous Customer',
      serviceName: (review.service as any)?.name || 'Unknown Service',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    }));

    return Response.json({
      success: true,
      data: {
        reviews: formattedReviews,
        totalCount: formattedReviews.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching business reviews:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}