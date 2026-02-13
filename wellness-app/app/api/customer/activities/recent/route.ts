import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CustomerModel from '@/models/Customer';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/User';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

interface IActivity {
  id: string;
  type: 'completed' | 'visited';
  service: {
    id?: string;
    name?: string;
  };
  therapist: {
    id?: string;
    name?: string;
  };
  business: {
    id?: string;
    name?: string;
  };
  date: Date;
  rating?: number;
  notes?: string;
  tags?: string[];
}

/**
 * Middleware to authenticate and authorize customer requests
 */
async function requireCustomerAuth(request: NextRequest) {
  try {
    await connectToDatabase();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { authenticated: false, error: 'Authentication token required', status: 401 };
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError: unknown) {
      return { authenticated: false, error: 'Invalid or expired token', status: 401 };
    }

    if (decoded.role.toLowerCase() !== 'customer') {
      return { authenticated: false, error: 'Access denied. Customer role required', status: 403 };
    }

    // Get user to verify existence
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return { authenticated: false, error: 'User not found', status: 404 };
    }

    return {
      authenticated: true,
      user: decoded
    };
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: (error instanceof Error) ? error.message : 'Internal server error', status: 500 };
  }
}

/**
 * GET endpoint to retrieve customer's recent activities
 * Protected by customer authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize the request
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const customerId = user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find customer profile
    const customer = await CustomerModel.findOne({ user: customerId });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Process wellness history to create recent activities
    let activities: IActivity[] = [];
    
    if (customer.wellnessHistory && customer.wellnessHistory.length > 0) {
      // Sort by date descending (most recent first)
      const sortedHistory = [...customer.wellnessHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Apply pagination
      const paginatedHistory = sortedHistory.slice(offset, offset + limit);
      
      // Transform wellness history entries into activity objects
      activities = paginatedHistory.map(entry => ({
        id: entry._id.toString(),
        type: entry.rating ? 'completed' : 'visited',
        service: {
          id: entry.serviceId?.toString(),
          name: entry.serviceName
        },
        therapist: {
          id: entry.therapistId?.toString(),
          name: entry.therapistName
        },
        business: {
          id: entry.businessId?.toString(),
          name: entry.businessName
        },
        date: entry.date,
        rating: entry.rating,
        notes: entry.notes,
        tags: entry.tags || []
      }));
    }

    // Add booked appointments that are upcoming
    // This would require joining with Booking collection in a real implementation
    // For now, we'll just return the wellness history activities
    
    return NextResponse.json({
      success: true,
      data: {
        activities: activities,
        pagination: {
          limit: limit,
          offset: offset,
          total: customer.wellnessHistory?.length || 0,
          hasMore: (offset + limit) < (customer.wellnessHistory?.length || 0)
        }
      }
    });
  } catch (error: unknown) {
    console.error('Error retrieving recent activities:', error);
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}