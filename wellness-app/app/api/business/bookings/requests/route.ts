import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking, { BookingStatus } from '@/models/Booking';
import Business from '@/models/Business';
import Service, { IService } from '@/models/Service';
import User from '@/models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

async function requireBusinessAuth(request: NextRequest) {
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

    if (decoded.role.toLowerCase() !== 'business') {
      return { authenticated: false, error: 'Access denied. Business role required', status: 403 };
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return { authenticated: false, error: 'User not found', status: 404 };
    }

    return { authenticated: true, user: decoded };
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: (error instanceof Error) ? error.message : 'Internal server error', status: 500 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireBusinessAuth(req);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const decoded = authResult.user;
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 401 });
    }

    await connectToDatabase();

    const business = await Business.findOne({ owner: decoded.id });
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business profile not found' }, { status: 404 });
    }

    const businessServices = await Service.find({ business: business._id }).select('_id');
    const serviceIds = businessServices.map((service: IService) => service._id);

    const bookings = await Booking.find({
      service: { $in: serviceIds },
      status: BookingStatus.Pending,
      therapist: null,
    })
      .populate({
        path: 'customer',
        select: 'name email',
      })
      .populate({
        path: 'service',
        select: 'name price duration',
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: unknown) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json({ success: false, error: (error instanceof Error) ? error.message : 'Internal server error' }, { status: 500 });
  }
}
