import { NextRequest, NextResponse } from 'next/server';
import { resetTherapistMonthlyCancellationCounters } from '@/utils/resetTherapistMonthlyCancellationCounters';

/**
 * API endpoint for automatic background task
 * This endpoint can be called by a cron job or scheduler to automatically 
 * reset therapist monthly cancellation counters at regular intervals
 * 
 * Cron schedule example: 0 0 1 * * (midnight on the first day of every month)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for a special authorization header or secret for background tasks
    const authHeader = request.headers.get('x-background-task-secret');
    const expectedSecret = process.env.BACKGROUND_TASK_SECRET;

    // If a secret is configured, require it in the header
    if (expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing background task secret' },
        { status: 401 }
      );
    }

    console.log('Starting monthly therapist cancellation counter reset via API...');
    console.log('Current time:', new Date().toISOString());
    
    const result = await resetTherapistMonthlyCancellationCounters();
    
    console.log('\n=== RESET SUMMARY ===');
    console.log(`Processed therapists: ${result.processedCount}`);
    console.log(`Reset successful: ${result.resetCount}`);
    
    if (result.resetTherapists.length > 0) {
      console.log('Reset details:');
      result.resetTherapists.forEach((therapist, index) => {
        console.log(`${index + 1}. Therapist ID: ${therapist._id}`);
        console.log(`   Name: ${therapist.fullName || 'Unknown'}`);
        console.log(`   Email: ${therapist.email || 'Unknown'}`);
        console.log(`   Previous monthlyCancelCount: ${therapist.previousData.monthlyCancelCount}`);
        console.log(`   Previous cancelWarnings: ${therapist.previousData.cancelWarnings}`);
        console.log(`   Previous bonusPenaltyPercentage: ${therapist.previousData.bonusPenaltyPercentage}`);
        console.log('   ---');
      });
    } else {
      console.log('No therapists required counter reset.');
    }
    
    console.log('Process completed successfully.');
    
    return NextResponse.json({
      success: true,
      message: 'Monthly therapist cancellation counters reset successfully',
      data: {
        processedCount: result.processedCount,
        resetCount: result.resetCount,
        resetTherapists: result.resetTherapists.map(t => ({
          _id: t._id,
          name: t.fullName || 'Unknown',
          email: t.email || 'Unknown',
          previousMonthlyCancelCount: t.previousData.monthlyCancelCount,
          previousCancelWarnings: t.previousData.cancelWarnings,
          previousBonusPenaltyPercentage: t.previousData.bonusPenaltyPercentage,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error during monthly reset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset monthly cancellation counters',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Also support GET requests for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
