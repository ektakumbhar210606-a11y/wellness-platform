import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel from '../../../../models/Therapist';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';

export async function POST(req: NextRequest) {
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

    // Check if therapist profile already exists for this user
    const existingProfile = await TherapistModel.findOne({ user: decoded.id });
    if (existingProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile already exists for this user' },
        { status: 409 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      fullName,
      email,
      phoneNumber,
      professionalTitle,
      bio,
      experience,
      location,
      skills,
      certifications,
      licenseNumber,
      weeklyAvailability
    } = body;

    // Validation
    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !professionalTitle ||
      experience === undefined ||
      experience === null ||
      !licenseNumber
    ) {
      return Response.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Validate weeklyAvailability if provided
    if (weeklyAvailability && Array.isArray(weeklyAvailability)) {
      for (const availability of weeklyAvailability) {
        if (!availability.day) {
          return Response.json(
            { success: false, error: 'Each availability item must have a day' },
            { status: 400 }
          );
        }

        // Only validate startTime and endTime if the day is marked as available
        if (availability.available !== false && (!availability.startTime || !availability.endTime)) {
          return Response.json(
            { success: false, error: 'Each available day must have startTime and endTime' },
            { status: 400 }
          );
        }

        // Validate day enum
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(availability.day)) {
          return Response.json(
            { success: false, error: 'Invalid day in weekly availability' },
            { status: 400 }
          );
        }
      }
    }

    // Create therapist profile
    const therapistProfile = new TherapistModel({
      user: decoded.id,  // Set the user field to userId from JWT
      business: null,    // Initially no business association
      experience: experience,
      expertise: skills || [],  // Map skills to expertise field
      availabilityStatus: 'available',  // Default availability status
      
      // Profile information
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      professionalTitle: professionalTitle,
      bio: bio,
      location: location,
      certifications: certifications || [],
      licenseNumber: licenseNumber,
      weeklyAvailability: weeklyAvailability || []
    });

    // Additional profile information could be stored in User model
    // or in a separate profile collection if needed

    await therapistProfile.save();

    return Response.json({
      success: true,
      message: 'Therapist profile created successfully',
      data: therapistProfile
    });
  } catch (error: any) {
    console.error('Error creating therapist profile:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}