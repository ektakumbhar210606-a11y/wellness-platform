// Test script to check service name handling
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ServiceModel = require('./models/Service');
const ServiceCategoryModel = require('./models/ServiceCategory');

async function testServiceName() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform');
    console.log('Connected to database');

    // Check service categories
    const categories = await ServiceCategoryModel.find({});
    console.log('Service Categories:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat._id})`);
    });

    // Check services
    const services = await ServiceModel.find({}).populate('serviceCategory');
    console.log('\nServices:');
    services.forEach(service => {
      console.log(`Service ID: ${service._id}`);
      console.log(`  Name: ${service.name || 'NOT SET'}`);
      console.log(`  Category: ${service.serviceCategory?.name || 'NOT SET'}`);
      console.log(`  Price: $${service.price}`);
      console.log(`  Duration: ${service.duration} minutes`);
      console.log('---');
    });

    // Test creating a new service with name field
    console.log('\nTesting service creation with name field...');
    
    const testCategory = categories.find(cat => cat.name === 'Massage Therapy');
    if (testCategory) {
      const newService = new ServiceModel({
        business: mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Dummy business ID
        serviceCategory: testCategory._id,
        name: 'Deep Tissue Massage Test',
        price: 120,
        duration: 90,
        description: 'Test service with specific name'
      });
      
      const savedService = await newService.save();
      console.log('Created test service:', {
        id: savedService._id,
        name: savedService.name,
        category: savedService.serviceCategory?.name
      });
      
      // Clean up - delete the test service
      await ServiceModel.findByIdAndDelete(savedService._id);
      console.log('Test service cleaned up');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testServiceName();