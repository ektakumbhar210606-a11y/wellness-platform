import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import { requireTherapistAuth } from '../../../../../lib/middleware/authMiddleware';
import ReviewModel from '../../../../../models/Review';
import TherapistModel from '../../../../../models/Therapist';

/**
 * GET endpoint to fetch monthly performance data for the authenticated therapist
 * Returns monthly average rating and total reviews for the specified month/year
 * 
 * Query parameters:
 * - month: Number (1-12, defaults to current month)
 * - year: Number (defaults to current year)
 * 
 * @param req - NextRequest object
 * @returns Response with monthly performance data
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
    console.log('Decoded user from token:', decoded);
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get therapist profile to get the therapist ID
    const therapistProfile = await TherapistModel.findOne({ user: decoded.id });
    console.log('Therapist profile found:', !!therapistProfile);
    if (!therapistProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    const therapistUserId = therapistProfile.user;
    console.log('Therapist User ID:', therapistUserId.toString());

    // Get month and year from query parameters, default to current month/year
    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    // Validate month and year
    if (isNaN(month) || month < 1 || month > 12) {
      return Response.json(
        { success: false, error: 'Invalid month. Month must be between 1 and 12.' },
        { status: 400 }
      );
    }

    if (isNaN(year) || year < 1900 || year > 2100) {
      return Response.json(
        { success: false, error: 'Invalid year. Year must be between 1900 and 2100.' },
        { status: 400 }
      );
    }

    // Calculate start and end dates for the specified month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // End of the month
    console.log('Start of month:', startOfMonth);
    console.log('End of month:', endOfMonth);

    // Fetch reviews for the therapist within the specified month
    const reviews = await ReviewModel.find({
      therapist: therapistUserId,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
    console.log('Monthly Reviews found:', reviews.length);

    // Calculate monthly performance metrics
    let monthlyTotalReviews = 0;
    let monthlyAverageRating = 0;

    if (reviews.length > 0) {
      monthlyTotalReviews = reviews.length;
      
      // Calculate sum of ratings
      const totalRatingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
      console.log('Total rating sum:', totalRatingSum);
      
      // Calculate average rating
      monthlyAverageRating = totalRatingSum / monthlyTotalReviews;
      console.log('Calculated average rating:', monthlyAverageRating);
    }

    // Round the average rating to 2 decimal places
    monthlyAverageRating = parseFloat(monthlyAverageRating.toFixed(2));

    return Response.json({
      success: true,
      monthlyTotalReviews,
      monthlyAverageRating
    });

  } catch (error: any) {
    console.error('Error fetching therapist monthly performance:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}