import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel, { IBusinessAssociation } from '../../../../models/Therapist';
import BusinessModel, { ITherapistAssociation } from '../../../../models/Business';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';
import { Types } from 'mongoose';

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

    // Parse request body
    const body = await req.json();
    const { businessId } = body;

    // Validate input
    if (!businessId) {
      return Response.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(businessId)) {
      return Response.json(
        { success: false, error: 'Invalid business ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find therapist by user ID
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      console.error('Therapist profile not found for user:', decoded.id);
      return Response.json(
        { success: false, error: 'Therapist profile not found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return Response.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if therapist already has a pending or approved request for this business
    const existingTherapistAssociation = therapist.associatedBusinesses?.find(
      (assoc: IBusinessAssociation) => assoc.businessId.toString() === businessId
    );

    if (existingTherapistAssociation) {
      if (existingTherapistAssociation.status === 'pending') {
        return Response.json(
          { success: false, error: 'Already requested this business' },
          { status: 409 }
        );
      }
      if (existingTherapistAssociation.status === 'approved') {
        return Response.json(
          { success: false, error: 'Already approved for this business' },
          { status: 409 }
        );
      }
    }

    // Check if business already has a pending or approved association for this therapist
    const existingBusinessAssociation = business.therapists?.find(
      (assoc: ITherapistAssociation) => assoc.therapistId.toString() === therapist._id.toString()
    );

    if (existingBusinessAssociation) {
      if (existingBusinessAssociation.status === 'pending') {
        return Response.json(
          { success: false, error: 'Business already has pending request from you' },
          { status: 409 }
        );
      }
      if (existingBusinessAssociation.status === 'approved') {
        return Response.json(
          { success: false, error: 'Business already approved you' },
          { status: 409 }
        );
      }
    }

    // Perform safe sequential updates (since MongoDB transactions require replica sets)
    const now = new Date();
    
    // Update therapist's associated businesses
    const therapistUpdate = await TherapistModel.findByIdAndUpdate(
      therapist._id,
      {
        $push: {
          associatedBusinesses: {
            businessId: new Types.ObjectId(businessId),
            status: 'pending',
            requestedAt: now
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!therapistUpdate) {
      return Response.json(
        { success: false, error: 'Failed to update therapist associations' },
        { status: 500 }
      );
    }

    // Update business's therapists
    const businessUpdate = await BusinessModel.findByIdAndUpdate(
      businessId,
      {
        $push: {
          therapists: {
            therapistId: therapist._id,
            status: 'pending'
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!businessUpdate) {
      // Rollback therapist update if business update fails
      await TherapistModel.findByIdAndUpdate(
        therapist._id,
        {
          $pull: {
            associatedBusinesses: {
              businessId: new Types.ObjectId(businessId)
            }
          }
        }
      );
      
      return Response.json(
        { success: false, error: 'Failed to update business associations' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Business association request submitted successfully'
    });

  } catch (error: any) {
    console.error('Error processing business request:', error);
    console.error('Full error details:', error.message, error.stack);
    return Response.json(
      { success: false, error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}