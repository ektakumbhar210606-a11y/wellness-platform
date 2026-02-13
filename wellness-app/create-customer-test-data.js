// Script to create test data for customer dashboard testing
// Run with: node create-customer-test-data.js

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function createCustomerTestData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Extract database name from URI
    const dbName = uri.includes('mongodb.net/') ? uri.split('mongodb.net/')[1].split('?')[0] : 'wellness-platform';
    const db = client.db(dbName);
    const users = db.collection('users');
    const bookings = db.collection('bookings');
    const reviews = db.collection('reviews');
    const services = db.collection('services');
    const therapists = db.collection('therapists');
    const businesses = db.collection('businesses');
    const servicecategories = db.collection('servicecategories');
    
    // Clear existing test data
    await users.deleteMany({ email: { $regex: /^test.*@example\.com$/ } });
    await bookings.deleteMany({});
    await reviews.deleteMany({});
    await services.deleteMany({});
    await therapists.deleteMany({});
    await businesses.deleteMany({});
    await servicecategories.deleteMany({});
    
    // Create test service category
    const serviceCategory = {
      name: 'Massage Services',
      isActive: true
    };
    const serviceCategoryResult = await servicecategories.insertOne(serviceCategory);
    console.log('✅ Created test service category');
    
    // Create test customer
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    
    const customer = {
      name: 'Test Customer',
      email: 'test.customer@example.com',
      password: hashedPassword,
      role: 'Customer',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const customerResult = await users.insertOne(customer);
    console.log('✅ Created test customer:', customer.email);
    
    // Create test therapist
    const therapist = {
      user: customerResult.insertedId,
      experience: 5,
      skills: ['Massage', 'Aromatherapy'],
      fullName: 'Test Therapist',
      professionalTitle: 'Licensed Massage Therapist',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const therapistResult = await therapists.insertOne(therapist);
    console.log('✅ Created test therapist:', therapist.fullName);
    
    // Create test business
    const business = {
      owner: customerResult.insertedId,
      name: 'Test Wellness Spa',
      address: {
        street: '123 Wellness St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      },
      openingTime: '09:00',
      closingTime: '18:00',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const businessResult = await businesses.insertOne(business);
    console.log('✅ Created test business:', business.name);
    
    // Create test service
    const service = {
      business: businessResult.insertedId,
      serviceCategory: serviceCategoryResult.insertedId,
      price: 85,
      duration: 60,
      description: 'Relaxing Swedish Massage',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const serviceResult = await services.insertOne(service);
    console.log('✅ Created test service:', service.description);
    
    // Create test bookings
    const today = new Date();
    const futureDate1 = new Date(today);
    futureDate1.setDate(today.getDate() + 7);
    
    const futureDate2 = new Date(today);
    futureDate2.setDate(today.getDate() + 14);
    
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 7);
    
    // Upcoming booking (pending)
    const booking1 = {
      customer: customerResult.insertedId,
      therapist: therapistResult.insertedId,
      service: serviceResult.insertedId,
      date: futureDate1,
      time: '14:00',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await bookings.insertOne(booking1);
    
    // Upcoming booking (confirmed)
    const booking2 = {
      customer: customerResult.insertedId,
      therapist: therapistResult.insertedId,
      service: serviceResult.insertedId,
      date: futureDate2,
      time: '10:00',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await bookings.insertOne(booking2);
    
    // Past booking (completed)
    const booking3 = {
      customer: customerResult.insertedId,
      therapist: therapistResult.insertedId,
      service: serviceResult.insertedId,
      date: pastDate,
      time: '15:00',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const booking3Result = await bookings.insertOne(booking3);
    
    // Create test review
    const review = {
      booking: booking3Result.insertedId,
      rating: 4.5,
      comment: 'Great service!',
      reviewDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await reviews.insertOne(review);
    console.log('✅ Created test review with rating:', review.rating);
    
    // Create additional test bookings for different scenarios
    const futureDate3 = new Date(today);
    futureDate3.setDate(today.getDate() + 21);
    
    // Another pending booking
    const booking4 = {
      customer: customerResult.insertedId,
      therapist: therapistResult.insertedId,
      service: serviceResult.insertedId,
      date: futureDate3,
      time: '16:00',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await bookings.insertOne(booking4);
    console.log('✅ Created additional pending booking');
    
    console.log('\n✅ Test data created successfully!');
    console.log('Customer email: test.customer@example.com');
    console.log('Customer password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createCustomerTestData();