require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./models/User.ts');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform');
    console.log('Connected to database');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'provider@test.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      console.log('Current role:', existingUser.role);
      // Update role if needed
      if (existingUser.role !== 'Business') {
        existingUser.role = 'Business';
        await existingUser.save();
        console.log('Updated user role to Business');
      }
      process.exit(0);
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = new User({
      name: 'Test Provider',
      email: 'provider@test.com',
      password: hashedPassword,
      role: 'Business'
    });
    
    await user.save();
    console.log('Test user created successfully:', user.email);
    console.log('Password: password123');
    console.log('Role: Business (Provider)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();