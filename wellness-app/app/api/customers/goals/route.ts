import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CustomerModel from '@/models/Customer';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import UserModel from '@/models/User';

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

// GET /api/customers/goals - Get customer wellness goals
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
    const customer = await CustomerModel.findOne({ user: userId }, 'wellnessGoals wellnessGoalsList');
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        wellnessGoals: customer.wellnessGoals,
        goals: customer.wellnessGoalsList
      }
    });
  } catch (error: any) {
    console.error('Error fetching customer goals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer goals' },
      { status: 500 }
    );
  }
}

// POST /api/customers/goals - Add a new wellness goal
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
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Goal title is required' },
        { status: 400 }
      );
    }

    const customer = await CustomerModel.findOne({ user: userId });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Add new goal
    const newGoal = {
      title: body.title,
      description: body.description || '',
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
      progress: body.progress || 0,
      completed: body.completed || false,
      createdAt: new Date()
    };

    customer.wellnessGoalsList.push(newGoal);
    await customer.save();

    return NextResponse.json({
      success: true,
      message: 'Wellness goal added successfully',
      data: newGoal
    });
  } catch (error: any) {
    console.error('Error adding wellness goal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add wellness goal' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/goals/[id] - Update a specific wellness goal
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const goalId = params.id;
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const customer = await CustomerModel.findOne({ user: userId });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Find the goal
    const goal = customer.wellnessGoalsList.id(goalId);
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Update goal fields
    if (body.title !== undefined) goal.title = body.title;
    if (body.description !== undefined) goal.description = body.description;
    if (body.targetDate !== undefined) goal.targetDate = body.targetDate ? new Date(body.targetDate) : undefined;
    if (body.progress !== undefined) {
      goal.progress = body.progress;
      goal.completed = body.progress >= 100;
    }
    if (body.completed !== undefined) goal.completed = body.completed;

    await customer.save();

    return NextResponse.json({
      success: true,
      message: 'Wellness goal updated successfully',
      data: goal
    });
  } catch (error: any) {
    console.error('Error updating wellness goal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update wellness goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/goals/[id] - Delete a specific wellness goal
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const goalId = params.id;
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const customer = await CustomerModel.findOne({ user: userId });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Check if goal exists
    const goal = customer.wellnessGoalsList.id(goalId);
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Remove the goal
    customer.wellnessGoalsList.pull({ _id: goalId });
    await customer.save();

    return NextResponse.json({
      success: true,
      message: 'Wellness goal deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting wellness goal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete wellness goal' },
      { status: 500 }
    );
  }
}