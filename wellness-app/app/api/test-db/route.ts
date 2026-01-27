// Test API connection to database
import { connectToDatabase } from '../../../lib/db';
import ServiceCategoryModel from '../../../models/ServiceCategory';

export async function GET() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    console.log('Fetching service categories...');
    const categories = await ServiceCategoryModel.find({ isActive: true });
    console.log('Found categories:', categories.length);
    
    return Response.json({
      success: true,
      message: 'Test successful',
      count: categories.length,
      sample: categories.slice(0, 3).map((c: any) => ({ 
        id: c._id.toString(), 
        name: c.name, 
        slug: c.slug 
      }))
    });
  } catch (error) {
    console.error('Test failed:', error);
    return Response.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}