import { NextRequest } from 'next/server';
import { cancelExpiredBookings } from '@/utils/cancelExpiredBookings';

/**
 * API endpoint for automatic background task
 * This endpoint can be called by a cron job or scheduler to automatically 
 * cancel expired bookings at regular intervals
 */
export async function POST(request: NextRequest) {
  try {
    // Check for a special authorization header or secret for background tasks
    const authHeader = request.headers.get('x-background-task-key');
    const expectedKey = process.env.BACKGROUND_TASK_KEY || 'dev-background-key';
    
    if (authHeader !== expectedKey) {
      return Response.json(
        { success: false, error: 'Unauthorized background task access' },
        { status: 401 }
      );
    }

    console.log('Starting automatic expired booking cancellation process...');
    
    // Trigger the cancellation process
    const result = await cancelExpiredBookings();

    console.log(`Background task completed: Cancelled ${result.cancelledCount} expired bookings`);

    return Response.json({
      success: true,
      message: `Successfully cancelled ${result.cancelledCount} expired bookings`,
      data: {
        cancelledCount: result.cancelledCount,
        timestamp: new Date().toISOString(),
        cancelledBookings: result.cancelledBookings.map(booking => ({
          id: booking._id.toString(),
          customer: (booking.customer as any)?.name || 'Unknown Customer',
          service: (booking.service as any)?.name || 'Unknown Service',
          date: booking.date,
          time: booking.time,
          previousStatus: booking.status,
          newStatus: 'cancelled'
        }))
      }
    });

  } catch (error: any) {
    console.error('Error in background cancel-expired-bookings task:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return Response.json({
    success: true,
    message: 'Background task endpoint is available',
    timestamp: new Date().toISOString()
  });
}