require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./models/User'); // Updated path to be relative to current directory
const bcrypt = require('bcryptjs');

async function createTestTherapist() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform');
    console.log('Connected to database');
    
    // Check if therapist user already exists
    const existingUser = await User.findOne({ email: 'therapist@test.com' });
    if (existingUser) {
      console.log('Test therapist already exists:', existingUser.email);
      console.log('Current role:', existingUser.role);
      console.log('Current role type:', typeof existingUser.role);
      // Update role if needed
      if (existingUser.role !== 'Therapist') {
        existingUser.role = 'Therapist';
        await existingUser.save();
        console.log('Updated user role to Therapist');
      }
      process.exit(0);
    }
    
    // Create test therapist user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = new User({
      name: 'Test Therapist',
      email: 'therapist@test.com',
      password: hashedPassword,
      role: 'Therapist'
    });
    
    await user.save();
    console.log('Test therapist created successfully:', user.email);
    console.log('Password: password123');
    console.log('Role:', user.role);
    console.log('Role type:', typeof user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test therapist:', error);
    process.exit(1);
  }
}

createTestTherapist();