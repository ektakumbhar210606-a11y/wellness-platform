import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BusinessModel from '../../../../models/Business';
import TherapistModel, { IBusinessAssociation } from '../../../../models/Therapist';
import UserModel, { IUser } from '../../../../models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

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
    } catch (verificationError: unknown) {
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize business user
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

    // Get therapists with populated user information and full profile
    const therapistsWithUsers = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id
    }).populate({
      path: 'user',
      select: 'firstName lastName email phone'
    }).select('+fullName +professionalTitle +bio +location +certifications +licenseNumber +weeklyAvailability +areaOfExpertise')
    .lean();

    // Separate and organize therapists by status
    const approvedTherapists = [];
    const pendingTherapists = [];

    for (const therapist of therapistsWithUsers) {
      // Find the association with this business
      const businessAssociation = therapist.associatedBusinesses?.find(
        (assoc: IBusinessAssociation) => assoc.businessId.toString() === business._id.toString()
      );

      if (businessAssociation) {
        const therapistData = {
          id: therapist._id,
          therapistId: therapist._id,
          userId: (therapist.user as IUser)._id,
          firstName: (therapist.user as IUser).firstName,
          lastName: (therapist.user as IUser).lastName,
          email: (therapist.user as IUser).email,
          phone: (therapist.user as IUser).phone,
          experience: therapist.experience,
          skills: therapist.skills,
          rating: therapist.rating,
          availabilityStatus: therapist.availabilityStatus,
          requestedAt: businessAssociation.requestedAt,
          approvedAt: businessAssociation.approvedAt,
          status: businessAssociation.status,
          
          // Enhanced profile information
          fullName: therapist.fullName,
          professionalTitle: therapist.professionalTitle,
          bio: therapist.bio,
          location: therapist.location,
          certifications: therapist.certifications,
          licenseNumber: therapist.licenseNumber,
          weeklyAvailability: therapist.weeklyAvailability,
          areaOfExpertise: therapist.areaOfExpertise
        };

        if (businessAssociation.status === 'approved') {
          approvedTherapists.push(therapistData);
        } else if (businessAssociation.status === 'pending') {
          pendingTherapists.push(therapistData);
        }
      }
    }

    // Sort approved therapists by approval date (newest first)
    approvedTherapists.sort((a, b) => 
      new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime()
    );

    // Sort pending therapists by request date (newest first)
    pendingTherapists.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    return Response.json({
      success: true,
      message: 'Therapists retrieved successfully',
      data: {
        approvedTherapists,
        pendingTherapists,
        counts: {
          approved: approvedTherapists.length,
          pending: pendingTherapists.length,
          total: approvedTherapists.length + pendingTherapists.length
        }
      }
    });

  } catch (error: unknown) {
    console.error('Error retrieving business therapists:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}