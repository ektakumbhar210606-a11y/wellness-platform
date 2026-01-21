import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import BusinessModel from '../../../models/Business';
import UserModel from '../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize therapist users
 */
async function requireTherapistAuth(request: NextRequest) {
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
    } catch (err) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Check user role - allow both 'Therapist' and 'therapist' for backward compatibility
    if (decoded.role.toLowerCase() !== 'therapist') {
      return {
        authenticated: false,
        error: 'Access denied. Therapist role required',
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
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: error.message || 'Internal server error',
      status: 500
    };
  }
}

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

    // Fetch ALL businesses from database (no filtering by therapist association)
    const businesses = await BusinessModel.find({}, {
      _id: 1,
      name: 1,
      address: 1,
      openingTime: 1,
      closingTime: 1,
      status: 1
    });

    return Response.json({
      success: true,
      message: 'Businesses retrieved successfully',
      data: businesses
    });

  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}