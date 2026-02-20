import mongoose from 'mongoose';
import BookingModel, { BookingStatus } from './models/Booking.js';
import { restoreCancelledBookings, previewRestoration } from './restore-cancelled-bookings.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testRestoration() {
  try {
    console.log('=== TESTING BOOKING RESTORATION SYSTEM ===\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Create test cancelled bookings with different scenarios
    console.log('1. Creating test cancelled bookings...');
    
    const testBookings = [];
    
    // Test booking 1: Completed booking that was cancelled
    const completedBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '10:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'completed',
      completedAt: new Date('2024-01-15T10:30:00Z'),
      createdAt: new Date('2024-01-01T09:00:00Z')
    });
    await completedBooking.save();
    testBookings.push(completedBooking._id);
    console.log(`✅ Created completed booking: ${completedBooking._id}`);
    
    // Test booking 2: Paid booking that was cancelled
    const paidBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '11:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'completed',
      createdAt: new Date('2024-01-02T10:00:00Z')
    });
    await paidBooking.save();
    testBookings.push(paidBooking._id);
    console.log(`✅ Created paid booking: ${paidBooking._id}`);
    
    // Test booking 3: Partial payment booking that was cancelled
    const partialBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '12:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'partial',
      confirmedAt: new Date('2024-01-10T14:20:00Z'),
      createdAt: new Date('2024-01-03T11:00:00Z')
    });
    await partialBooking.save();
    testBookings.push(partialBooking._id);
    console.log(`✅ Created partial payment booking: ${partialBooking._id}`);
    
    // Test booking 4: Confirmed booking that was cancelled
    const confirmedBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '13:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'pending',
      confirmedAt: new Date('2024-01-12T09:15:00Z'),
      confirmedBy: 'test-user-id',
      createdAt: new Date('2024-01-04T12:00:00Z')
    });
    await confirmedBooking.save();
    testBookings.push(confirmedBooking._id);
    console.log(`✅ Created confirmed booking: ${confirmedBooking._id}`);
    
    // Test booking 5: Admin-assigned therapist-responded booking that was cancelled
    const therapistConfirmedBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '14:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'pending',
      assignedByAdmin: true,
      therapistResponded: true,
      createdAt: new Date('2024-01-05T13:00:00Z')
    });
    await therapistConfirmedBooking.save();
    testBookings.push(therapistConfirmedBooking._id);
    console.log(`✅ Created therapist-confirmed booking: ${therapistConfirmedBooking._id}`);
    
    // Test booking 6: Admin-assigned no-response booking that was cancelled
    const pendingBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '15:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'pending',
      assignedByAdmin: true,
      therapistResponded: false,
      createdAt: new Date('2024-01-06T14:00:00Z')
    });
    await pendingBooking.save();
    testBookings.push(pendingBooking._id);
    console.log(`✅ Created pending booking: ${pendingBooking._id}`);
    
    // Test booking 7: Regular booking that was cancelled
    const regularBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(),
      time: '16:00',
      status: BookingStatus.Cancelled,
      paymentStatus: 'pending',
      assignedByAdmin: false,
      createdAt: new Date('2024-01-07T15:00:00Z')
    });
    await regularBooking.save();
    testBookings.push(regularBooking._id);
    console.log(`✅ Created regular booking: ${regularBooking._id}\n`);
    
    // Show current state
    console.log('2. Current cancelled bookings:');
    const currentBookings = await BookingModel.find({
      _id: { $in: testBookings }
    });
    
    currentBookings.forEach(booking => {
      console.log(`   ID: ${booking._id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment: ${booking.paymentStatus}`);
      console.log(`   Completed: ${booking.completedAt}`);
      console.log(`   Confirmed: ${booking.confirmedAt}`);
      console.log(`   Admin Assigned: ${booking.assignedByAdmin}`);
      console.log(`   Therapist Responded: ${booking.therapistResponded}`);
      console.log('');
    });
    
    // Run preview
    console.log('3. Running preview...');
    await previewRestoration();
    console.log('');
    
    // Run actual restoration
    console.log('4. Running restoration...');
    const result = await restoreCancelledBookings();
    console.log('');
    
    // Verify results
    console.log('5. Verifying restored bookings:');
    const restoredBookings = await BookingModel.find({
      _id: { $in: testBookings }
    });
    
    const expectedResults = {
      [completedBooking._id.toString()]: BookingStatus.Completed,
      [paidBooking._id.toString()]: BookingStatus.Paid,
      [partialBooking._id.toString()]: BookingStatus.Confirmed,
      [confirmedBooking._id.toString()]: BookingStatus.Confirmed,
      [therapistConfirmedBooking._id.toString()]: BookingStatus.TherapistConfirmed,
      [pendingBooking._id.toString()]: BookingStatus.Pending,
      [regularBooking._id.toString()]: BookingStatus.Pending
    };
    
    let allCorrect = true;
    restoredBookings.forEach(booking => {
      const expectedStatus = expectedResults[booking._id.toString()];
      const isCorrect = booking.status === expectedStatus;
      console.log(`   ID: ${booking._id}`);
      console.log(`   Status: ${booking.status} ${isCorrect ? '✅' : '❌'}`);
      console.log(`   Expected: ${expectedStatus}`);
      console.log(`   Cancelled By: ${booking.cancelledBy || 'cleared'} ${!booking.cancelledBy ? '✅' : '❌'}`);
      console.log('');
      
      if (!isCorrect) allCorrect = false;
    });
    
    // Test results summary
    console.log('6. Test Results Summary:');
    console.log(`   Bookings processed: ${result.restoredCount}`);
    console.log(`   All status mappings correct: ${allCorrect ? '✅ YES' : '❌ NO'}`);
    
    if (result.restoredCount === 7 && allCorrect) {
      console.log('\n🎉 All tests passed! The restoration system is working correctly.');
      console.log('✅ Completed bookings restored to "completed"');
      console.log('✅ Paid bookings restored to "paid"');
      console.log('✅ Partial payment bookings restored to "confirmed"');
      console.log('✅ Confirmed bookings restored to "confirmed"');
      console.log('✅ Therapist-confirmed bookings restored to "therapist_confirmed"');
      console.log('✅ Pending bookings restored to "pending"');
      console.log('✅ Regular bookings restored to "pending"');
      console.log('✅ Cancellation metadata cleared');
    } else {
      console.log('\n❌ Some tests failed. Please review the implementation.');
    }
    
    // Cleanup
    console.log('\n7. Cleaning up test data...');
    await BookingModel.deleteMany({
      _id: { $in: testBookings }
    });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  }
}

// Run the test
testRestoration();