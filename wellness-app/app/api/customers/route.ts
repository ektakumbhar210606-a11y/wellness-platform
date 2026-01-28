import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CustomerModel, { ICustomer } from '@/models/Customer';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/User';
import '@/models/Therapist'; // Import to ensure model is registered
import '@/models/Business'; // Import to ensure model is registered
import '@/models/Service'; // Import to ensure model is registered

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Helper function to authenticate and get user ID
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
    } catch (err) {
      return { authenticated: false, error: 'Invalid or expired token', status: 401 };
    }

    if (decoded.role.toLowerCase() !== 'customer') {
      return { authenticated: false, error: 'Access denied. Customer role required', status: 403 };
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return { authenticated: false, error: 'User not found', status: 404 };
    }

    return { authenticated: true, user: decoded };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: error.message || 'Internal server error', status: 500 };
  }
}

// GET /api/customers/me - Get current customer profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    // Fetch customer profile without problematic population
    const customer = await CustomerModel.findOne({ user: userId }).select('-favoriteTherapists -favoriteServices');

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create or update customer profile (onboarding)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const body = await request.json();
    
    // Validate required fields only for final submission
    const isPartialSubmission = !body.onboardingCompleted && !body.wellnessGoals;
    
    console.log('Received customer data:', JSON.stringify(body, null, 2));
    console.log('Is partial submission:', isPartialSubmission);
    
    if (!isPartialSubmission) {
      const requiredFields = ['fullName', 'email', 'phoneNumber', 'wellnessGoals'];
      for (const field of requiredFields) {
        if (!body[field]) {
          console.log(`Missing required field: ${field}`);
          return NextResponse.json(
            { success: false, error: `${field} is required` },
            { status: 400 }
          );
        }
      }
    }

    // Check if customer profile already exists
    const existingCustomer = await CustomerModel.findOne({ user: userId });
    
    const shouldMarkOnboardingComplete = isPartialSubmission === false && body.wellnessGoals;
    
    if (existingCustomer) {
      // Update existing profile
      const updateData = {
        ...body,
        ...(shouldMarkOnboardingComplete && {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        })
      };
      
      const updatedCustomer = await CustomerModel.findByIdAndUpdate(
        existingCustomer._id,
        updateData,
        { new: true, runValidators: true }
      );
      // Removed population to avoid Therapist model issues

      return NextResponse.json({
        success: true,
        message: shouldMarkOnboardingComplete 
          ? 'Customer profile completed successfully' 
          : 'Customer profile updated successfully',
        data: updatedCustomer
      });
    } else {
      // Create new profile
      const newCustomer = new CustomerModel({
        user: userId,
        ...body,
        ...(shouldMarkOnboardingComplete && {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        })
      });

      // Save the customer profile
      const savedCustomer = await newCustomer.save();
      
      // Return success response without population (to avoid Therapist model issues)
      return NextResponse.json({
        success: true,
        message: shouldMarkOnboardingComplete 
          ? 'Customer profile created successfully' 
          : 'Customer profile saved successfully',
        data: savedCustomer
      });
    }
  } catch (error: any) {
    console.error('Error creating/updating customer profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors: Record<string, string> = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create/update customer profile' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/me - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const body = await request.json();
    
    // Remove fields that shouldn't be updated directly
    const { _id, user, createdAt, updatedAt, onboardingCompletedAt, ...updateData } = body;
    
    const updatedCustomer = await CustomerModel.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('favoriteTherapists', 'fullName professionalTitle rating')
     .populate('favoriteServices', 'name description price duration');

    if (!updatedCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedCustomer
    });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors: Record<string, string> = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/me - Delete customer profile (use with caution)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const deletedCustomer = await CustomerModel.findOneAndDelete({ user: userId });

    if (!deletedCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer profile deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting customer profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer profile' },
      { status: 500 }
    );
  }
}