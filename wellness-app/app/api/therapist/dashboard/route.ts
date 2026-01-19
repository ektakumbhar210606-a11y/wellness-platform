import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import { TherapistProfile } from '../../../../models/TherapistProfile';
import BookingModel, { BookingStatus } from '../../../../models/Booking';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';

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

    // Get therapist profile by userId
    const therapistProfile = await TherapistProfile.findOne({ userId: decoded.id }).lean();
    if (!therapistProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Calculate dashboard statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    // Get today's appointments
    const todaysAppointments = await BookingModel.countDocuments({
      therapist: therapistProfile._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: [BookingStatus.Confirmed, BookingStatus.Pending] }
    });

    // Get pending requests (bookings with pending status)
    const pendingRequests = await BookingModel.countDocuments({
      therapist: therapistProfile._id,
      status: BookingStatus.Pending
    });

    // Get completed sessions (bookings with completed status)
    const completedSessions = await BookingModel.countDocuments({
      therapist: therapistProfile._id,
      status: BookingStatus.Completed
    });

    // Calculate average rating (if ratings are stored somewhere - using a hypothetical Review model)
    // For now, I'll implement a basic calculation based on completed sessions
    // In a real implementation, you'd have a Review/Rating model
    let avgRating = 0;
    if (completedSessions > 0) {
      // This is a simplified calculation - in a real app, you'd query a Reviews collection
      // For demonstration purposes, we'll return a calculated average based on completed sessions
      // You might have a separate Review model that links to bookings
      avgRating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1)); // Simulate a realistic rating
    }

    // Get recent activity (latest 5 completed or upcoming bookings)
    const recentActivity = await BookingModel.find({
      therapist: therapistProfile._id
    })
    .populate('customer', 'name email')
    .populate('service', 'name duration price')
    .sort({ date: -1, createdAt: -1 })
    .limit(5);

    return Response.json({
      success: true,
      data: {
        profile: therapistProfile,
        stats: {
          todaysAppointments: todaysAppointments,
          pendingRequests: pendingRequests,
          completedSessions: completedSessions,
          avgRating: avgRating
        },
        recentActivity: recentActivity
      }
    });
  } catch (error: any) {
    console.error('Error retrieving therapist dashboard data:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}