import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceCategoryModel from '@/models/ServiceCategory';

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Fetch all active service categories, sorted alphabetically by name
    const categories = await ServiceCategoryModel.find(
      { isActive: true },
      { _id: 1, name: 1, slug: 1 } // Return id, name, and slug
    ).sort({ name: 1 });

    // Format the response
    const formattedCategories = categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug
    }));

    return NextResponse.json(
      { 
        success: true,
        message: 'Service categories retrieved successfully',
        data: formattedCategories
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching service categories:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve service categories',
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}