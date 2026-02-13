import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel, { IBusinessAssociation } from '../../../../models/Therapist';
import BusinessModel, { ITherapistAssociation } from '../../../../models/Business';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

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

export async function PATCH(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { therapistId, action } = body;

    // Validate input
    if (!therapistId || !action) {
      return Response.json(
        { success: false, error: 'Therapist ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    if (action !== 'approve' && action !== 'reject') {
      return Response.json(
        { success: false, error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(therapistId)) {
      return Response.json(
        { success: false, error: 'Invalid therapist ID format' },
        { status: 400 }
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

    // Verify therapist exists
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Check if therapist has a pending request for this business
    const therapistAssociationIndex = therapist.associatedBusinesses?.findIndex(
      (assoc: IBusinessAssociation) => 
        assoc.businessId.toString() === business._id.toString() && 
        assoc.status === 'pending'
    );

    if (therapistAssociationIndex === undefined || therapistAssociationIndex === -1) {
      return Response.json(
        { success: false, error: 'No pending request found from this therapist' },
        { status: 404 }
      );
    }

    // Check if business has a pending request from this therapist
    const businessAssociationIndex = business.therapists?.findIndex(
      (assoc: ITherapistAssociation) => 
        assoc.therapistId.toString() === therapistId && 
        assoc.status === 'pending'
    );

    if (businessAssociationIndex === undefined || businessAssociationIndex === -1) {
      return Response.json(
        { success: false, error: 'No pending request found for this therapist' },
        { status: 404 }
      );
    }

    const now = new Date();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update therapist's associated businesses
    const updatedTherapist = await TherapistModel.findByIdAndUpdate(
      therapist._id,
      {
        $set: {
          [`associatedBusinesses.${therapistAssociationIndex}.status`]: newStatus,
          ...(action === 'approve' && { 
            [`associatedBusinesses.${therapistAssociationIndex}.approvedAt`]: now 
          })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedTherapist) {
      return Response.json(
        { success: false, error: 'Failed to update therapist associations' },
        { status: 500 }
      );
    }

    // Update business's therapists
    const updatedBusiness = await BusinessModel.findByIdAndUpdate(
      business._id,
      {
        $set: {
          [`therapists.${businessAssociationIndex}.status`]: newStatus,
          ...(action === 'approve' && { 
            [`therapists.${businessAssociationIndex}.joinedAt`]: now 
          })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      // Rollback therapist update if business update fails
      await TherapistModel.findByIdAndUpdate(
        therapist._id,
        {
          $set: {
            [`associatedBusinesses.${therapistAssociationIndex}.status`]: 'pending',
            [`associatedBusinesses.${therapistAssociationIndex}.approvedAt`]: undefined
          }
        }
      );
      
      return Response.json(
        { success: false, error: 'Failed to update business associations' },
        { status: 500 }
      );
    }

    const message = action === 'approve' 
      ? 'Therapist approved successfully' 
      : 'Therapist request rejected';

    return Response.json({
      success: true,
      message,
      data: {
        therapistId: therapist._id,
        businessId: business._id,
        action: newStatus,
        timestamp: now
      }
    });

  } catch (error: unknown) {
    console.error('Error processing therapist approval:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}