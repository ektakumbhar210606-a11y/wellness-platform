// Simple MongoDB script to check and fix therapist roles
// Save this as check-users.js and run with: node check-users.js

const { MongoClient } = require('mongodb');

async function checkUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wellness-platform');
    const users = db.collection('users');
    
    // Find all users
    const allUsers = await users.find({}).toArray();
    
    console.log('\n=== ALL USERS ===');
    allUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`ID: ${user._id}`);
      console.log('---');
    });
    
    // Find users with therapist-related roles
    const therapistUsers = await users.find({
      role: { $in: ['Therapist', 'therapist', 'THERAPIST'] }
    }).toArray();
    
    console.log('\n=== THERAPIST USERS ===');
    if (therapistUsers.length === 0) {
      console.log('No users with therapist roles found');
    } else {
      therapistUsers.forEach(user => {
        console.log(`Email: ${user.email} | Role: ${user.role}`);
      });
    }
    
    // Look for a specific test user
    const testUser = await users.findOne({ email: 'therapist@test.com' });
    if (testUser) {
      console.log('\n=== TEST THERAPIST USER ===');
      console.log(`Found: ${testUser.email}`);
      console.log(`Current role: ${testUser.role}`);
      
      // Fix the role if needed
      if (testUser.role !== 'Therapist') {
        await users.updateOne(
          { _id: testUser._id },
          { $set: { role: 'Therapist' } }
        );
        console.log('Fixed role to Therapist');
      }
    } else {
      console.log('\n=== CREATING TEST THERAPIST USER ===');
      // You would need to implement user creation here
      console.log('Test user not found. You need to create one.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();