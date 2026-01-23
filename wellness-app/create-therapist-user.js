// Script to create a test therapist user
// Run with: node create-therapist-user.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTherapistUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wellness-platform');
    const users = db.collection('users');
    
    // Check if user already exists
    const existingUser = await users.findOne({ email: 'therapist@test.com' });
    
    if (existingUser) {
      console.log('User already exists:');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Current role: ${existingUser.role}`);
      
      // Update role if needed
      if (existingUser.role !== 'Therapist') {
        await users.updateOne(
          { _id: existingUser._id },
          { $set: { role: 'Therapist' } }
        );
        console.log('Updated role to Therapist');
      } else {
        console.log('Role is already correct');
      }
      return;
    }
    
    // Create new therapist user
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    
    const newUser = {
      name: 'Test Therapist',
      email: 'therapist@test.com',
      password: hashedPassword,
      role: 'Therapist',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(newUser);
    
    console.log('✅ Test therapist user created successfully!');
    console.log(`Email: therapist@test.com`);
    console.log(`Password: password123`);
    console.log(`Role: Therapist`);
    console.log(`User ID: ${result.insertedId}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await client.close();
  }
}

createTherapistUser();