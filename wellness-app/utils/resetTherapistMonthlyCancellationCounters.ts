/**
 * Utility function to reset therapist monthly cancellation counters
 * This function resets the following fields:
 * - monthlyCancelCount = 0
 * - cancelWarnings = 0
 * - bonusPenaltyPercentage = 0
 * 
 * It does NOT reset totalCancelCount as that is a lifetime statistic
 */

import { connectToDatabase, disconnectFromDatabase } from '@/lib/db';
import TherapistModel from '@/models/Therapist';

interface ResetResult {
  processedCount: number;
  resetCount: number;
  resetTherapists: Array<{
    _id: string;
    fullName: string | null;
    email: string | null;
    previousData: {
      monthlyCancelCount: number;
      cancelWarnings: number;
      bonusPenaltyPercentage: number;
    };
  }>;
}

export async function resetTherapistMonthlyCancellationCounters(): Promise<ResetResult> {
  const result: ResetResult = {
    processedCount: 0,
    resetCount: 0,
    resetTherapists: [],
  };

  try {
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Find all therapists with non-zero monthly cancellation counters
    const therapists = await TherapistModel.find({
      $or: [
        { monthlyCancelCount: { $ne: 0 } },
        { cancelWarnings: { $ne: 0 } },
        { bonusPenaltyPercentage: { $ne: 0 } }
      ]
    }).lean();

    result.processedCount = therapists.length;
    console.log(`Found ${therapists.length} therapists with non-zero counters`);

    // Process each therapist
    for (const therapist of therapists) {
      try {
        // Store previous data for logging
        const previousData = {
          monthlyCancelCount: therapist.monthlyCancelCount || 0,
          cancelWarnings: therapist.cancelWarnings || 0,
          bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0,
        };

        // Reset the monthly counters
        await TherapistModel.findByIdAndUpdate(therapist._id, {
          monthlyCancelCount: 0,
          cancelWarnings: 0,
          bonusPenaltyPercentage: 0,
        });

        // Add to result list
        result.resetTherapists.push({
          _id: therapist._id.toString(),
          fullName: therapist.fullName || null,
          email: therapist.email || null,
          previousData,
        });

        result.resetCount++;
        console.log(`Reset counters for therapist: ${therapist._id}`);
        
      } catch (error) {
        console.error(`Error resetting therapist ${therapist._id}:`, error);
        // Continue with next therapist even if one fails
      }
    }

    console.log(`Successfully reset ${result.resetCount} out of ${result.processedCount} therapists`);
    
  } catch (error) {
    console.error('Error during cancellation counter reset:', error);
    throw error;
  } finally {
    // Disconnect from database
    await disconnectFromDatabase();
    console.log('Disconnected from database');
  }

  return result;
}
