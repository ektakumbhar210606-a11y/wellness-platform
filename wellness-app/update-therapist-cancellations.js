/**
 * Script to manually update therapist cancellation counters for past bookings
 * Uses direct MongoDB connection
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function updateTherapistCancellations() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const db = client.db();
    const therapistsCollection = db.collection('therapists');

    // Your therapist ID from the booking data
    const therapistId = new ObjectId('697b38cf5f78da5ab3671ae0');

    console.log(`\n📊 Updating therapist ${therapistId}...`);

    // Find the therapist
    const therapist = await therapistsCollection.findOne({ _id: therapistId });

    if (!therapist) {
      console.log('❌ Therapist not found!');
      return;
    }

    console.log(`Current stats for ${therapist.fullName || 'Unknown'}:`);
    console.log(`  monthlyCancelCount: ${therapist.monthlyCancelCount || 0}`);
    console.log(`  totalCancelCount: ${therapist.totalCancelCount || 0}`);
    console.log(`  cancelWarnings: ${therapist.cancelWarnings || 0}`);
    console.log(`  bonusPenaltyPercentage: ${therapist.bonusPenaltyPercentage || 0}`);

    // Update the counters - increment by 1 for the missing cancellation
    const newMonthlyCount = (therapist.monthlyCancelCount || 0) + 1;
    const newTotalCount = (therapist.totalCancelCount || 0) + 1;
    
    // Apply penalty rules based on new monthly count
    let newCancelWarnings = therapist.cancelWarnings || 0;
    let newBonusPenaltyPercentage = therapist.bonusPenaltyPercentage || 0;
    
    if (newMonthlyCount >= 7) {
      newCancelWarnings = 1;
      newBonusPenaltyPercentage = 100;
    } else if (newMonthlyCount >= 6) {
      newCancelWarnings = 1;
      newBonusPenaltyPercentage = 25;
    } else if (newMonthlyCount >= 5) {
      newCancelWarnings = 1;
      newBonusPenaltyPercentage = 10;
    } else if (newMonthlyCount >= 3) {
      newCancelWarnings = 1;
    }

    // Update in database
    const result = await therapistsCollection.updateOne(
      { _id: therapistId },
      {
        $set: {
          monthlyCancelCount: newMonthlyCount,
          totalCancelCount: newTotalCount,
          cancelWarnings: newCancelWarnings,
          bonusPenaltyPercentage: newBonusPenaltyPercentage,
          updatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Updated stats:');
    console.log(`  monthlyCancelCount: ${newMonthlyCount}`);
    console.log(`  totalCancelCount: ${newTotalCount}`);
    console.log(`  cancelWarnings: ${newCancelWarnings}`);
    console.log(`  bonusPenaltyPercentage: ${newBonusPenaltyPercentage}`);
    console.log(`\n💡 Documents modified: ${result.modifiedCount}`);
    console.log('\n💡 Refresh the therapist dashboard to see the updated cancellation count!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

console.log('🔧 Updating therapist cancellation counters...\n');
updateTherapistCancellations();
