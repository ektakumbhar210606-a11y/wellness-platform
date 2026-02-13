import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BusinessModel from '../../../../models/Business';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch ALL active businesses from database (no authentication required)
    const businesses = await BusinessModel.find({ status: 'active' }, {
      _id: 1,
      name: 1,
      description: 1,
      address: 1,
      phone: 1,
      email: 1,
      website: 1,
      openingTime: 1,
      closingTime: 1,
      businessHours: 1,
      status: 1,
      createdAt: 1
    }).sort({ createdAt: -1 }); // Newest first

    return Response.json({
      success: true,
      message: 'Businesses retrieved successfully',
      data: businesses,
      count: businesses.length
    });

  } catch (error: unknown) {
    console.error('Error fetching businesses:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}