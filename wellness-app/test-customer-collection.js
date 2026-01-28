// Script to test customer model creation
// Run with: node test-create-customer.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testCustomerCollection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('serenity_db');
    
    // Check if customers collection exists
    const collections = await db.listCollections().toArray();
    const customerCollectionExists = collections.some(c => c.name === 'customers');
    
    console.log('Customer collection exists:', customerCollectionExists);
    
    if (!customerCollectionExists) {
      console.log('Customer collection will be created automatically when first document is inserted');
    } else {
      const customerCount = await db.collection('customers').countDocuments();
      console.log('Number of customers in collection:', customerCount);
    }
    
    console.log('\n✅ Customer collection test completed successfully');
    console.log('The collection will be created automatically when the first customer profile is created through the API.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testCustomerCollection();