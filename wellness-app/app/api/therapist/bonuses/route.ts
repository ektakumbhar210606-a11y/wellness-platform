import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('Authorization');

    // Check if authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access denied. No valid token provided.' },
        { status: 401 }
      );
    }

    // Extract the token from the header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (verificationError: unknown) {
      // Handle different types of JWT errors
      if (verificationError instanceof Error) {
        if (verificationError.name === 'TokenExpiredError') {
          return NextResponse.json(
            { error: 'Token has expired. Please log in again.' },
            { status: 401 }
          );
        } else if (verificationError.name === 'JsonWebTokenError') {
          return NextResponse.json(
            { error: 'Invalid token. Access denied.' },
            { status: 401 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Authentication failed. Invalid token.' },
        { status: 401 }
      );
    }

    // Extract user information from the decoded token
    const userId = (decoded as JwtPayload).id;
    const userRole = (decoded as JwtPayload).role;

    // Check if the user has the 'Therapist' role (case insensitive)
    const normalizedUserRole = userRole.toLowerCase();
    if (normalizedUserRole !== 'therapist') {
      return NextResponse.json(
        { error: 'Access denied. Only therapists can view their bonuses.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Import required models
    const therapistBonusModule = await import('@/models/TherapistBonus');
    const TherapistBonus = therapistBonusModule.default;
    
    const userModule = await import('@/models/User');
    const User = userModule.default;
    
    const therapistModelModule = await import('@/models/Therapist');
    const TherapistModel = therapistModelModule.default;

    console.log(`Fetching bonuses for therapist userId: ${userId}`);
    
    // Get the therapist profile ID from the user ID
    const therapistProfile = await TherapistModel.findOne({ user: userId });
    
    if (!therapistProfile) {
      console.log(`No therapist profile found for user ${userId}`);
      return NextResponse.json(
        { 
          success: true,
          bonuses: [],
          totalBonuses: 0,
          totalPaid: 0,
          totalPending: 0,
          message: 'No therapist profile found'
        },
        { status: 200 }
      );
    }
    
    const therapistProfileId = therapistProfile._id.toString();
    console.log(`Found therapist profile ID: ${therapistProfileId}`);

    // Fetch bonuses with business details for this therapist using PROFILE ID
    const bonuses = await TherapistBonus.find({ therapist: therapistProfileId })
      .populate('business', 'name firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`Found ${bonuses.length} bonuses for therapist ${userId}`);

    // Format the response with business names and bonus details
    const formattedBonuses = bonuses.map(bonus => {
      const business = bonus.business;
      let businessName = 'Unknown Business';
      
      console.log('Processing bonus:', {
        bonusId: bonus._id,
        businessData: business,
        rawBusinessName: business?.name,
        rawFirstName: business?.firstName,
        rawLastName: business?.lastName
      });
      
      if (business) {
        // Try to get name from various sources
        businessName = business.name || 
                       `${business.firstName || ''} ${business.lastName || ''}`.trim() || 
                       'Unknown Business';
        
        console.log('Resolved business name to:', businessName);
      }
      
      return {
        id: bonus._id.toString(),
        businessId: business?._id?.toString() || '',
        businessName: businessName,
        month: bonus.month,
        year: bonus.year,
        averageRating: bonus.averageRating,
        totalReviews: bonus.totalReviews,
        bonusAmount: bonus.bonusAmount,
        status: bonus.status,
        createdAt: bonus.createdAt
      };
    });

    return NextResponse.json(
      {
        success: true,
        bonuses: formattedBonuses,
        totalBonuses: formattedBonuses.length,
        totalPaid: formattedBonuses.filter(b => b.status === 'paid').length,
        totalPending: formattedBonuses.filter(b => b.status === 'pending').length
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error fetching therapist bonuses:', error);

    // Handle CastError (invalid ID format)
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
