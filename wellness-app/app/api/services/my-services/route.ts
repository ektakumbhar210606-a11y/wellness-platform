import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';
import ServiceCategoryModel from '@/models/ServiceCategory';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import TherapistModel from '@/models/Therapist';

// Import ServiceCategoryModel to ensure it's registered with Mongoose
// This is needed for populate() to work with serviceCategory references
ServiceCategoryModel;

// Import TherapistModel to ensure it's registered with Mongoose
// This is needed for populate() to work with therapists references
TherapistModel;

// Simple JWT verification (for demo purposes)
// In production, use a proper JWT library like 'jsonwebtoken'
function verifyToken(token: string, secret: string): any {
  try {
    // For demo purposes, we'll just decode the payload
    // In production, use a proper JWT library
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // In a real implementation, you would verify the signature here
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decodedToken: any;
    try {
      decodedToken = verifyToken(token, process.env.JWT_SECRET || 'fallback_secret_key');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch the user from the database to verify their role
    const user = await UserModel.findById(decodedToken.id || decodedToken.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user has the 'Provider' or 'Business' role
    if (user.role.toLowerCase() !== 'business' && user.role.toLowerCase() !== 'provider') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Find the business associated with the user
    const business = await BusinessModel.findOne({ owner: user._id });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Force ServiceCategory model registration by doing a simple find
    // This ensures Mongoose knows about the ServiceCategory schema for populate()
    await ServiceCategoryModel.findOne({});
    
    // Fetch all services for the user's business with populated service categories and therapists
    const services = await ServiceModel.find({ business: business._id })
      .populate('serviceCategory', 'name')
      .populate('therapists', 'fullName professionalTitle firstName lastName')
      .populate('teamMembers', 'fullName professionalTitle firstName lastName')
      .sort({ createdAt: -1 });

    // Format the services for the response
    const formattedServices = services.map(service => {
      console.log('Service data from DB:', {
        id: service._id.toString(),
        name: service.name,
        serviceCategory: service.serviceCategory?.name,
        price: service.price,
        duration: service.duration
      });
      // Type the therapists and team members properly
      const therapists = service.therapists ? (service.therapists as any[]).map(therapist => ({
        id: therapist._id.toString(),
        fullName: therapist.fullName,
        professionalTitle: therapist.professionalTitle,
        firstName: therapist.firstName,
        lastName: therapist.lastName
      })) : [];
      
      const teamMembers = service.teamMembers ? (service.teamMembers as any[]).map(member => ({
        id: member._id.toString(),
        fullName: member.fullName,
        professionalTitle: member.professionalTitle,
        firstName: member.firstName,
        lastName: member.lastName
      })) : [];
      
      return {
        id: service._id.toString(),
        name: service.name, // Add the specific service name
        serviceCategory: service.serviceCategory ? {
          id: service.serviceCategory._id.toString(),
          name: service.serviceCategory.name
        } : null,
        price: service.price,
        duration: service.duration,
        description: service.description,
        createdAt: service.createdAt,
        therapists,
        teamMembers
      };
    });

    return NextResponse.json(
      { 
        message: 'Services fetched successfully', 
        services: formattedServices
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching services:', error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}