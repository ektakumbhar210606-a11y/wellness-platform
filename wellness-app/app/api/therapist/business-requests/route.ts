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

    // Find therapist by user ID
    const therapist = await TherapistModel.findOne({ user: decoded.id });
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Get all business associations with populated business information
    const businessAssociations = therapist.associatedBusinesses || [];
    
    // Get detailed information for each business
    const businessRequests = [];
    
    for (const association of businessAssociations) {
      const business = await BusinessModel.findById(association.businessId);
      
      if (business) {
        businessRequests.push({
          id: association._id?.toString(),
          businessId: association.businessId.toString(),
          businessName: business.name,
          businessAddress: business.address,
          businessDescription: business.description,
          businessStatus: business.status,
          status: association.status,
          requestedAt: association.requestedAt,
          approvedAt: association.approvedAt,
          // Include business contact info if needed
          businessContact: {
            email: business.email,
            phone: business.phone,
            website: business.website
          }
        });
      }
    }

    // Sort by request date (newest first)
    businessRequests.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    // Separate by status
    const pendingRequests = businessRequests.filter(req => req.status === 'pending');
    const approvedRequests = businessRequests.filter(req => req.status === 'approved');
    const rejectedRequests = businessRequests.filter(req => req.status === 'rejected');

    return Response.json({
      success: true,
      message: 'Business requests retrieved successfully',
      data: {
        allRequests: businessRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        counts: {
          pending: pendingRequests.length,
          approved: approvedRequests.length,
          rejected: rejectedRequests.length,
          total: businessRequests.length
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching therapist business requests:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}