import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CustomerModel from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Count customers
    const customerCount = await CustomerModel.countDocuments();
    
    // Get a sample customer if exists
    const sampleCustomer = await CustomerModel.findOne({}).lean();
    
    return Response.json({
      success: true,
      message: 'Customer collection test successful',
      customerCount,
      hasCustomers: customerCount > 0,
      sampleCustomer: sampleCustomer ? {
        fullName: sampleCustomer.fullName,
        email: sampleCustomer.email,
        wellnessGoals: sampleCustomer.wellnessGoals,
        onboardingCompleted: sampleCustomer.onboardingCompleted
      } : null
    });
  } catch (error: any) {
    console.error('Error testing customer collection:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}