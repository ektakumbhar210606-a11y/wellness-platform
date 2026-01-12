import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import { TherapistProfile } from '../../../../models/TherapistProfile';
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

    return Response.json({
      success: true,
      message: 'Therapist profile retrieved successfully',
      data: therapistProfile
    });
  } catch (error: any) {
    console.error('Error retrieving therapist profile:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}