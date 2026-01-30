const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixBusinessData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const businesses = db.collection('businesses');
  
  // Fix the Wellness hub business with incorrect state data
  const result = await businesses.updateOne(
    { 
      name: 'Wellness hub', 
      'address.country': 'USA' 
    },
    { 
      $set: { 
        'address.state': 'Florida', 
        'address.city': 'Miami' 
      } 
    }
  );
  
  console.log(`Updated ${result.modifiedCount} business record`);
  
  // Verify the fix by checking USA states
  const usaStates = await businesses.distinct('address.state', { 
    'address.country': 'USA',
    status: 'active'
  });
  
  console.log('USA states after fix:', usaStates.sort());
  
  await client.close();
}

fixBusinessData();