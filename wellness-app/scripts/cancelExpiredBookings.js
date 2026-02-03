/**
 * Script to manually trigger the automatic cancellation of expired bookings
 * This can be run via command line: node cancelExpiredBookings.js
 */

const { cancelExpiredBookings } = require('../utils/cancelExpiredBookings');

async function runManualCancellation() {
  try {
    console.log('Starting manual expired booking cancellation process...');
    console.log('Current time:', new Date().toISOString());
    
    const result = await cancelExpiredBookings();
    
    console.log('\n=== CANCELLATION SUMMARY ===');
    console.log(`Cancelled bookings: ${result.cancelledCount}`);
    console.log('Cancelled booking details:');
    
    if (result.cancelledBookings.length > 0) {
      result.cancelledBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking._id}`);
        console.log(`   Customer: ${booking.customer?.name || 'Unknown'}`);
        console.log(`   Service: ${booking.service?.name || 'Unknown'}`);
        console.log(`   Date: ${booking.date.toDateString()}`);
        console.log(`   Time: ${booking.time}`);
        console.log(`   Previous Status: ${booking.status}`);
        console.log('   ---');
      });
    } else {
      console.log('No expired bookings found to cancel.');
    }
    
    console.log('Process completed successfully.');
    
  } catch (error) {
    console.error('Error during manual cancellation:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  runManualCancellation();
}

module.exports = { runManualCancellation };