import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/db';
import User from '../../../../models/User';

// Simple JWT-like token generation (for demo purposes)
// In production, use a proper JWT library like 'jsonwebtoken'
function generateToken(payload: any, secret: string, expiresIn: string): string {
  // Encode payload as base64
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  // For demo purposes, return a simple token
  // In production, use a proper JWT library
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const fakeSignature = Buffer.from('fake_signature_for_demo').toString('base64');
  
  return `${header}.${encodedPayload}.${fakeSignature}`;
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

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
    const user = await User.findOne({ email }).select('+password'); // Include password field
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token (using our simple implementation)
    // In production, use a proper JWT library
    const token = generateToken(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      process.env.JWT_EXPIRES_IN || '7d'
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