const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createTestService() {
  try {
    // First, get a service category ID
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('serenity_db');
    const categoriesCollection = db.collection('servicecategories');
    
    // Get the first category
    const category = await categoriesCollection.findOne();
    console.log('Using category:', category.name);
    
    // Get the business ID
    const businessesCollection = db.collection('businesses');
    const business = await businessesCollection.findOne({ name: 'Test Business' });
    console.log('Business ID:', business._id);
    
    // Create a service directly in the database
    const servicesCollection = db.collection('services');
    
    const serviceData = {
      business: business._id,
      serviceCategory: category._id,
      name: 'Test Massage Service',
      description: 'A relaxing massage service for testing',
      price: 80,
      duration: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await servicesCollection.insertOne(serviceData);
    console.log('Service created successfully with ID:', result.insertedId);
    
    await client.close();
  } catch (error) {
    console.error('Error creating service:', error.message);
  }
}

createTestService();