import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../../lib/db';
import User, { IUser } from '../../../../models/User';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    const conn = await connectToDatabase();
    console.log('Connected to database:', conn.connection.name);

    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Find user by email
    console.log('Searching for user with email:', email);
    const user = await User.findOne({ email }).select('+password'); // Include password field
    
    if (!user) {
      console.log('User not found for email:', email);
      // Check if there are any users in the database
      const userCount = await User.countDocuments();
      console.log('Total users in database:', userCount);
      if (userCount > 0) {
        // List all users
        const allUsers = await User.find().select('email');
        console.log('All users in database:', allUsers.map(u => u.email));
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User found:', user.email, user.role);

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Password valid for user:', user.email);

    // Generate JWT token with user ID, role and 7-day expiration
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return success response with user role and token
    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}