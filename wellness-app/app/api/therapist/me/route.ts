import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel from '../../../../models/Therapist';
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

    // Find therapist by user ID - ensure proper comparison
    const therapist = await TherapistModel.findOne({ user: decoded.id });

    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Return clean JSON response with only the relevant fields
    const therapistData = {
      id: therapist._id.toString(),
      userId: therapist.user.toString(),
      businessId: therapist.business ? therapist.business.toString() : null,
      experience: therapist.experience,
      skills: therapist.skills,
      rating: therapist.rating,
      availabilityStatus: therapist.availabilityStatus,
      associatedBusinesses: therapist.associatedBusinesses?.map((assoc: any) => ({
        businessId: assoc.businessId.toString(),
        status: assoc.status,
        requestedAt: assoc.requestedAt,
        approvedAt: assoc.approvedAt
      })) || [],
      fullName: therapist.fullName,
      email: therapist.email,
      phoneNumber: therapist.phoneNumber,
      professionalTitle: therapist.professionalTitle,
      bio: therapist.bio,
      location: therapist.location,
      certifications: therapist.certifications,
      licenseNumber: therapist.licenseNumber,
      weeklyAvailability: therapist.weeklyAvailability,
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt
    };

    return Response.json({
      success: true,
      message: 'Therapist profile retrieved successfully',
      data: therapistData
    });

  } catch (error: any) {
    console.error('Error fetching therapist profile:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}