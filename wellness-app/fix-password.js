require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function fixPassword() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform');
  
  try {
    await client.connect();
    // Extract database name from URI
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    const dbName = uri.includes('mongodb.net/') ? uri.split('mongodb.net/')[1].split('?')[0] : 'wellness-platform';
    const db = client.db(dbName);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    console.log('New hash:', hashedPassword);
    
    await db.collection('users').updateOne(
      { email: 'test.customer@example.com' },
      { $set: { password: hashedPassword } }
    );
    console.log('Password updated');
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.close();
  }
}

fixPassword();