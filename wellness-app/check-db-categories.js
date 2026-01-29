const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkServiceCategories() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('serenity_db');
    const collection = db.collection('servicecategories');
    
    // Fetch all service categories
    const categories = await collection.find({}).sort({ name: 1 }).toArray();
    
    console.log(`Found ${categories.length} service categories:`);
    console.log('=====================================');
    
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Check for the specific categories requested
    console.log('\n=====================================');
    console.log('Checking for requested categories:');
    
    const requiredCategories = [
      'Massage Therapy',
      'Spa Services',
      'Wellness Programs', 
      'Corporate Wellness'
    ];
    
    requiredCategories.forEach(categoryName => {
      const found = categories.find(cat => cat.name === categoryName);
      if (found) {
        console.log(`✅ ${categoryName}: Found (ID: ${found._id}, Active: ${found.isActive})`);
      } else {
        console.log(`❌ ${categoryName}: NOT FOUND`);
      }
    });
    
    // Show all active categories
    console.log('\n=====================================');
    console.log('All ACTIVE categories:');
    const activeCategories = categories.filter(cat => cat.isActive);
    activeCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

checkServiceCategories();