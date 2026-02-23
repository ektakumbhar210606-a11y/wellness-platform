import { NextRequest } from 'next/server';
import { requireBusinessAuth } from '@/lib/middleware';
import ReviewModel from '@/models/Review';
import BusinessModel from '@/models/Business';
import TherapistModel from '@/models/Therapist';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Business Reviews API Test ===');
    
    // Authenticate and authorize
    const authResult = await requireBusinessAuth(req);
    if (!authResult.success) {
      console.log('Authentication failed:', authResult.error);
      return Response.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }
    
    // At this point, we know success is true, so decoded must exist
    const decoded = authResult.decoded!; // Non-null assertion since we've checked success is true
    console.log('Authenticated user:', decoded);
    
    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    console.log('Found business:', business?._id);
    
    if (!business) {
      console.log('No business found for user');
      return Response.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Find therapists associated with this business
    const therapists = await TherapistModel.find({ business: business._id });
    console.log('Found therapists:', therapists.map(t => t._id));
    
    // Get all reviews for these therapists
    const therapistIds = therapists.map(t => t.user);
    console.log('Therapist user IDs:', therapistIds);
    
    const reviews = await ReviewModel.find({
      therapist: { $in: therapistIds }
    })
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
    .sort({ createdAt: -1 })
    .lean();
    
    console.log('Found reviews:', reviews.length);
    console.log('Review data:', reviews.map(r => ({
      id: r._id,
      therapist: r.therapist?._id,
      therapistUser: r.therapist?.user,
      customer: r.customer,
      service: r.service,
      rating: r.rating
    })));
    
    // Transform reviews data
    const formattedReviews = reviews.map(review => ({
      therapistName: review.therapist?.fullName || 
        `${review.therapist?.user?.firstName || ''} ${review.therapist?.user?.lastName || ''}`.trim() || 
        'Unknown Therapist',
      customerName: `${review.customer?.firstName || ''} ${review.customer?.lastName || ''}`.trim() || 'Anonymous Customer',
      serviceName: review.service?.name || 'Unknown Service',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    }));
    
    console.log('Formatted reviews:', formattedReviews);
    
    return Response.json({
      success: true,
      data: {
        reviews: formattedReviews,
        totalCount: formattedReviews.length,
        debug: {
          businessId: business._id,
          therapistIds: therapistIds,
          rawReviewsCount: reviews.length
        }
      }
    });
    
  } catch (error: any) {
    console.error('Business reviews API error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}