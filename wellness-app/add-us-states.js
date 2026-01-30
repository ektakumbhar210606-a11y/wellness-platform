const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addUSStates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const businesses = db.collection('businesses');
  
  // First, check if US businesses with proper states already exist
  const existingUSBusinesses = await businesses.countDocuments({ 
    'address.country': 'USA',
    'address.state': { $in: ['California', 'New York', 'Texas'] }
  });
  
  if (existingUSBusinesses > 0) {
    console.log('US businesses with proper states already exist');
    await client.close();
    return;
  }
  
  const usBusinesses = [
    {
      name: 'California Spa Center',
      description: 'Wellness services in California',
      serviceType: 'spa',
      serviceName: 'Relaxation Therapy',
      address: { 
        street: '456 Wellness Blvd', 
        city: 'Los Angeles', 
        state: 'California', 
        zipCode: '90210', 
        country: 'USA' 
      },
      phone: '+1-555-0101',
      email: 'ca@uswellness.com',
      openingTime: '09:00',
      closingTime: '19:00',
      businessHours: { 
        Monday: { open: '09:00', close: '19:00', closed: false }, 
        Tuesday: { open: '09:00', close: '19:00', closed: false }, 
        Wednesday: { open: '09:00', close: '19:00', closed: false }, 
        Thursday: { open: '09:00', close: '19:00', closed: false }, 
        Friday: { open: '09:00', close: '20:00', closed: false }, 
        Saturday: { open: '10:00', close: '18:00', closed: false }, 
        Sunday: { open: '10:00', close: '17:00', closed: false } 
      },
      status: 'active',
      createdAt: new Date()
    },
    {
      name: 'New York Wellness Hub',
      description: 'Wellness services in New York',
      serviceType: 'wellness',
      serviceName: 'Holistic Healing',
      address: { 
        street: '789 Health Ave', 
        city: 'New York', 
        state: 'New York', 
        zipCode: '10001', 
        country: 'USA' 
      },
      phone: '+1-555-0102',
      email: 'ny@uswellness.com',
      openingTime: '08:00',
      closingTime: '20:00',
      businessHours: { 
        Monday: { open: '08:00', close: '20:00', closed: false }, 
        Tuesday: { open: '08:00', close: '20:00', closed: false }, 
        Wednesday: { open: '08:00', close: '20:00', closed: false }, 
        Thursday: { open: '08:00', close: '20:00', closed: false }, 
        Friday: { open: '08:00', close: '21:00', closed: false }, 
        Saturday: { open: '09:00', close: '18:00', closed: false }, 
        Sunday: { open: '09:00', close: '17:00', closed: false } 
      },
      status: 'active',
      createdAt: new Date()
    },
    {
      name: 'Texas Massage Therapy',
      description: 'Massage therapy in Texas',
      serviceType: 'massage',
      serviceName: 'Deep Tissue Massage',
      address: { 
        street: '321 Relaxation St', 
        city: 'Houston', 
        state: 'Texas', 
        zipCode: '77001', 
        country: 'USA' 
      },
      phone: '+1-555-0103',
      email: 'tx@uswellness.com',
      openingTime: '10:00',
      closingTime: '18:00',
      businessHours: { 
        Monday: { open: '10:00', close: '18:00', closed: false }, 
        Tuesday: { open: '10:00', close: '18:00', closed: false }, 
        Wednesday: { open: '10:00', close: '18:00', closed: false }, 
        Thursday: { open: '10:00', close: '18:00', closed: false }, 
        Friday: { open: '10:00', close: '19:00', closed: false }, 
        Saturday: { open: '10:00', close: '16:00', closed: false }, 
        Sunday: { open: '11:00', close: '16:00', closed: false } 
      },
      status: 'active',
      createdAt: new Date()
    }
  ];
  
  const result = await businesses.insertMany(usBusinesses);
  console.log(`Added ${result.insertedCount} US businesses with proper states`);
  await client.close();
}

addUSStates();