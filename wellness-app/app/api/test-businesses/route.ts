import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BusinessModel from '@/models/Business';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all businesses
    const businesses = await BusinessModel.find({});
    
    return Response.json({
      businesses: businesses.map(business => ({
        id: business._id,
        name: business.name
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}