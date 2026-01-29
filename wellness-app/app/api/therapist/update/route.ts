import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel from '../../../../models/Therapist';
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
      status,
      areaOfExpertise
    } = body;

    // Build update object with only provided fields that exist in the Therapist schema
    const updateData: any = {};
    
    // Therapist-specific fields
    if (experience !== undefined) updateData.experience = experience;
    if (skills) updateData.skills = skills;
    if (status) updateData.availabilityStatus = status;
    
    // Profile information fields
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (professionalTitle !== undefined) updateData.professionalTitle = professionalTitle;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (certifications !== undefined) {
      // Handle both array format and comma-separated string format
      if (typeof certifications === 'string') {
        // Split comma-separated string and trim whitespace
        updateData.certifications = certifications.split(',').map(cert => cert.trim()).filter(cert => cert);
      } else {
        updateData.certifications = certifications;
      }
    }
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (weeklyAvailability !== undefined) updateData.weeklyAvailability = weeklyAvailability;
    if (areaOfExpertise !== undefined) updateData.areaOfExpertise = areaOfExpertise;

    // Validate required fields if they are being updated
    if (updateData.experience !== undefined && (updateData.experience === null || updateData.experience < 0)) {
      return Response.json(
        { success: false, error: 'Experience cannot be null or negative' },
        { status: 400 }
      );
    }

    // Validate skills if provided
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return Response.json(
          { success: false, error: 'Skills must be an array' },
          { status: 400 }
        );
      }
      
      if (skills.length < 1) {
        return Response.json(
          { success: false, error: 'At least one skill is required' },
          { status: 400 }
        );
      }
      
      // Validate each skill ID against our master list
      const { validateSkillIds } = require('../../../../lib/constants/skillsConstants');
      if (!validateSkillIds(skills)) {
        return Response.json(
          { success: false, error: 'Invalid skill ID(s) provided' },
          { status: 400 }
        );
      }
    }
    
    // Validate areaOfExpertise if provided
    if (areaOfExpertise !== undefined) {
      if (!Array.isArray(areaOfExpertise)) {
        return Response.json(
          { success: false, error: 'areaOfExpertise must be an array' },
          { status: 400 }
        );
      }
      
      // Validate each expertise ID against our master list
      const { validateExpertiseIds } = require('../../../../lib/constants/expertiseConstants');
      if (!validateExpertiseIds(areaOfExpertise)) {
        return Response.json(
          { success: false, error: 'Invalid expertise ID(s) provided' },
          { status: 400 }
        );
      }
    }
    
    // Validate weeklyAvailability if provided
    console.log('Received weeklyAvailability data:', weeklyAvailability);
    if (updateData.weeklyAvailability && Array.isArray(updateData.weeklyAvailability)) {
      for (const availability of updateData.weeklyAvailability) {
        if (!availability.day) {
          return Response.json(
            { success: false, error: 'Each availability item must have a day' },
            { status: 400 }
          );
        }

        // Validate startTime and endTime are present
        if (!availability.startTime || !availability.endTime) {
          return Response.json(
            { success: false, error: 'Each day must have startTime and endTime' },
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
    console.log('Updating therapist profile for user ID:', decoded.id);
    console.log('Update data being saved:', {
      ...updateData,
      weeklyAvailabilityCount: updateData.weeklyAvailability ? updateData.weeklyAvailability.length : 0
    });
    
    const updatedProfile = await TherapistModel.findOneAndUpdate(
      { user: decoded.id },
      { $set: updateData },
      { new: true, runValidators: true } // Return updated document and run schema validations
    );

    if (!updatedProfile) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }
    
    console.log('Profile updated successfully, new weeklyAvailability:', {
      count: updatedProfile.weeklyAvailability ? updatedProfile.weeklyAvailability.length : 0,
      data: updatedProfile.weeklyAvailability
    });

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