import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import TherapistModel from '../../../../models/Therapist';
import BusinessModel from '../../../../models/Business';
import { requireTherapistAuth } from '../../../../lib/middleware/authMiddleware';
import { Types } from 'mongoose';

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

    // Find therapist by user ID to get their business associations
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Get all businesses
    const allBusinesses = await BusinessModel.find({}, {
      _id: 1,
      name: 1,
      address: 1,
      openingTime: 1,
      closingTime: 1,
      status: 1
    });

    // Map businesses with association status
    const businessesWithStatus = allBusinesses.map(business => {
      // Find if therapist has an association with this business
      const association = therapist.associatedBusinesses?.find(
        (assoc: any) => assoc.businessId.toString() === business._id.toString()
      );

      return {
        ...business.toObject(),
        associationStatus: association ? association.status : 'none' // none, pending, approved, rejected
      };
    });

    return Response.json({
      success: true,
      message: 'Businesses retrieved successfully with association status',
      data: businessesWithStatus
    });

  } catch (error: any) {
    console.error('Error fetching businesses with association status:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}