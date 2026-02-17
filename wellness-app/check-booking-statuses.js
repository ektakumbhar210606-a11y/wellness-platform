// Simple test to check current booking status values in database
const { connectToDatabase } = require('./lib/db');
const mongoose = require('mongoose');

async function checkBookingStatuses() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('Connected to database');
    
    // Check what status values currently exist in the database
    const db = mongoose.connection.db;
    const statusValues = await db.collection('bookings').distinct('status');
    console.log('Current status values in database:', statusValues);
    
    // Check the collection validation rules
    try {
      const collectionInfo = await db.admin().command({ 
        listCollections: 1, 
        filter: { name: 'bookings' } 
      });
      console.log('\nCollection validation info:');
      if (collectionInfo.cursor && collectionInfo.cursor.firstBatch && collectionInfo.cursor.firstBatch[0]) {
        const validator = collectionInfo.cursor.firstBatch[0].options?.validator;
        if (validator) {
          console.log('Current validator:', JSON.stringify(validator, null, 2));
        } else {
          console.log('No validator found');
        }
      }
    } catch (error) {
      console.log('Could not retrieve collection info:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the check
checkBookingStatuses();