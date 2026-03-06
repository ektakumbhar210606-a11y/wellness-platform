import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';
import ReviewModel from '../../../../models/Review';
import TherapistModel from '../../../../models/Therapist';

/**
 * GET endpoint to fetch all reviews for the authenticated therapist
 * Returns reviews with customer and service information, sorted by newest first
 * 
 * @param req - NextRequest object
 * @returns Response with reviews data and therapist statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize therapist
    const authResult = await requireTherapistAuth(req);
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

    // Get therapist profile to get the therapist ID
    const therapistProfile = await TherapistModel.findOne({ user: decoded.id });
    if (!therapistProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    const therapistId = therapistProfile._id;

    // Fetch all reviews for this therapist with populated data
    // Note: Review.therapist field references User ID, so we query by the therapist's user ID
    const reviews = await ReviewModel.find({ therapist: decoded.id })
      .populate({
        path: 'customer',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'service',
        select: 'name',
        model: 'Service'
      })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    // Transform reviews data to match required response format
    const formattedReviews = reviews.map(review => ({
      rating: review.rating,
      comment: review.comment,
      customerName: (review.customer as any)?.name || 'Anonymous Customer',
      serviceName: (review.service as any)?.name || 'Unknown Service',
      createdAt: review.createdAt
    }));

    // Get therapist statistics
    const averageRating = therapistProfile.averageRating || 0;
    const totalReviews = therapistProfile.totalReviews || 0;

    return Response.json({
      success: true,
      data: {
        reviews: formattedReviews,
        therapist: {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews: totalReviews
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching therapist reviews:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}