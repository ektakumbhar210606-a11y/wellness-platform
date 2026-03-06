// MongoDB Shell Script: Fix Therapist Bonus References
// Run this in MongoDB Compass Shell or mongosh
// 
// Usage:
//   1. Open MongoDB Compass
//   2. Connect to your database
//   3. Open the shell
//   4. Copy and paste this entire script
//   5. Press Enter to run

console.log('=== FIXING THERAPIST BONUS REFERENCES ===\n');

const db = db.getSiblingDB('wellness-platform');

// Get all bonus records
const bonuses = db.therapistbonuses.find({}).toArray();
console.log(`Found ${bonuses.length} bonus record(s)\n`);

if (bonuses.length === 0) {
  console.log('No bonus records to fix.');
} else {
  let fixedCount = 0;
  let errorCount = 0;
  let alreadyCorrectCount = 0;
  
  bonuses.forEach(bonus => {
    const currentTherapistId = bonus.therapist;
    
    try {
      // Try to find this as a Therapist profile ID
      const therapistProfile = db.therapists.findOne({ _id: currentTherapistId });
      
      if (therapistProfile) {
        // This IS a Therapist profile ID - needs fixing
        const correctUserId = therapistProfile.user;
        
        console.log(`Fixing bonus ${bonus._id}...`);
        console.log(`  Current (wrong): ${currentTherapistId} (Therapist profile)`);
        console.log(`  Changing to: ${correctUserId} (User account)`);
        console.log(`  Therapist name: ${therapistProfile.fullName || 'N/A'}\n`);
        
        db.therapistbonuses.updateOne(
          { _id: bonus._id },
          { $set: { therapist: correctUserId } }
        );
        fixedCount++;
      } else {
        // Check if it's already a User ID
        const userExists = db.users.findOne({ _id: currentTherapistId });
        
        if (userExists) {
          console.log(`Bonus ${bonus._id}: Already correct (${currentTherapistId})\n`);
          alreadyCorrectCount++;
        } else {
          console.log(`⚠️  Bonus ${bonus._id}: ID not found in either collection (${currentTherapistId})\n`);
          errorCount++;
        }
      }
    } catch (err) {
      console.error(`❌ Error processing bonus ${bonus._id}:`, err.message);
      errorCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total records checked: ${bonuses.length}`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Already correct: ${alreadyCorrectCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  if (fixedCount > 0) {
    console.log('\n✓ Successfully migrated bonus records!');
    console.log('Therapist names should now display correctly in the UI.\n');
  }
}
