import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> }
) {
  try {
    console.log('Test API Route - Raw params promise:', params);
    const awaitedParams = await params;
    console.log('Test API Route - Awaited params:', awaitedParams);
    const { businessId, serviceId } = awaitedParams;
    
    console.log('Test API Route - businessId:', businessId);
    console.log('Test API Route - serviceId:', serviceId);
    console.log('Test API Route - businessId type:', typeof businessId);
    console.log('Test API Route - serviceId type:', typeof serviceId);
    console.log('Test API Route - businessId length:', businessId ? businessId.length : 'undefined');
    console.log('Test API Route - serviceId length:', serviceId ? serviceId.length : 'undefined');
    
    // Validate businessId and serviceId
    if (!businessId || !serviceId) {
      console.log('Test API Route - Validation failed: businessId=', businessId, 'serviceId=', serviceId);
      return Response.json(
        { 
          message: 'Business ID and Service ID are required',
          receivedParams: awaitedParams,
          businessId: businessId,
          serviceId: serviceId,
          businessIdType: typeof businessId,
          serviceIdType: typeof serviceId
        },
        { status: 400 }
      );
    }
    
    return Response.json(
      { 
        message: 'Parameters received successfully',
        businessId: businessId,
        serviceId: serviceId,
        businessIdType: typeof businessId,
        serviceIdType: typeof serviceId,
        businessIdLength: businessId.length,
        serviceIdLength: serviceId.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test API Route - Error:', error);
    return Response.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}