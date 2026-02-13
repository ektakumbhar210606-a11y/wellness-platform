import { MongoClient } from 'mongodb';

// Set environment variables directly
process.env.MONGODB_URI = 'mongodb+srv://serenity_admin:serenity1234@cluster0.bfwkcc7.mongodb.net/serenity_db';
process.env.JWT_SECRET = 'supersecretkey';

console.log('Environment variables set:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function checkDatabase() {
  try {
    console.log('MONGODB_URI from env:', process.env.MONGODB_URI);
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    console.log('Using URI:', uri);
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('serenity_db');
    console.log('Using database:', db.databaseName);
    
    // List all collections
    const allCollections = await db.listCollections().toArray();
    console.log('Collections:', allCollections.map(c => c.name));
    
    // Create collections if they don't exist
    const collectionNames = allCollections.map(c => c.name);
    
    if (!collectionNames.includes('businesses')) {
      await db.createCollection('businesses');
      console.log('Created businesses collection');
    }
    
    if (!collectionNames.includes('services')) {
      await db.createCollection('services');
      console.log('Created services collection');
    }
    
    // Check businesses
    const businesses = await db.collection('businesses').find({}).toArray();
    console.log('Businesses:', businesses.map(b => ({ id: b._id, name: b.name })));
    
    // Check services
    const services = await db.collection('services').find({}).toArray();
    console.log('Services:', services.map(s => ({ id: s._id, name: s.name, business: s.business })));
    
    // Create a test service for the existing business
    const testBusiness = businesses.find(b => b.name === 'Test Business');
    if (testBusiness) {
      const servicesForBusiness = await db.collection('services').find({ business: testBusiness._id }).toArray();
      if (servicesForBusiness.length === 0) {
        const serviceCategoryId = (await db.collection('servicecategories').findOne())._id;
        await db.collection('services').insertOne({
          business: testBusiness._id,
          serviceCategory: serviceCategoryId,
          name: 'Test Service',
          description: 'A test service for development',
          price: 100,
          duration: 60,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Created test service for Test Business');
      }
    }
    
    // If no businesses exist, create a test business
    if (businesses.length === 0) {
      const businessId = await db.collection('businesses').insertOne({
        name: 'Test Business',
        description: 'A test business for development',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        phone: '123-456-7890',
        email: 'test@business.com',
        openingTime: '09:00',
        closingTime: '17:00',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created test business with ID:', businessId.insertedId);
      
      // Create a test service
      const serviceCategoryId = (await db.collection('servicecategories').findOne())._id;
      await db.collection('services').insertOne({
        business: businessId.insertedId,
        serviceCategory: serviceCategoryId,
        name: 'Test Service',
        description: 'A test service for development',
        price: 100,
        duration: 60,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created test service');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();