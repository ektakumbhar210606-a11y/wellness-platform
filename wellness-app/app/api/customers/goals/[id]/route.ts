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
    } catch (verificationError: unknown) {
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: (error instanceof Error) ? error.message : 'Internal server error', status: 500 };
  }
}

// PUT /api/customers/goals/[id] - Update a specific wellness goal
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const { id: goalId } = await params;
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
  } catch (error: unknown) {
    console.error('Error updating wellness goal:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Failed to update wellness goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/goals/[id] - Delete a specific wellness goal
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;

    const { id: goalId } = await params;
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
  } catch (error: unknown) {
    console.error('Error deleting wellness goal:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Failed to delete wellness goal' },
      { status: 500 }
    );
  }
}
