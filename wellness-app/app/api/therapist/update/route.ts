import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import { TherapistProfile } from '../../../../models/TherapistProfile';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';

export async function PUT(req: NextRequest) {
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
      weeklyAvailability,
      status
    } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (professionalTitle) updateData.professionalTitle = professionalTitle;
    if (bio !== undefined) updateData.bio = bio;
    if (experience !== undefined) updateData.experience = experience;
    if (location) updateData.location = location;
    if (skills) updateData.skills = skills;
    if (certifications) updateData.certifications = certifications;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;
    if (weeklyAvailability) updateData.weeklyAvailability = weeklyAvailability;
    if (status) updateData.status = status;

    // Validate required fields if they are being updated
    if (updateData.experience !== undefined && (updateData.experience === null || updateData.experience < 0)) {
      return Response.json(
        { success: false, error: 'Experience cannot be null or negative' },
        { status: 400 }
      );
    }

    // Validate weeklyAvailability if provided
    if (updateData.weeklyAvailability && Array.isArray(updateData.weeklyAvailability)) {
      for (const availability of updateData.weeklyAvailability) {
        if (!availability.day || !availability.startTime || !availability.endTime) {
          return Response.json(
            { success: false, error: 'Each availability item must have day, startTime, and endTime' },
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

    // Update therapist profile
    const updatedProfile = await TherapistProfile.findOneAndUpdate(
      { userId: decoded.id },
      { $set: updateData },
      { new: true, runValidators: true } // Return updated document and run schema validations
    );

    if (!updatedProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'Therapist profile updated successfully',
      data: updatedProfile
    });
  } catch (error: any) {
    console.error('Error updating therapist profile:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}