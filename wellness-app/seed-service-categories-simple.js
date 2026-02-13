import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const defaultCategories = [
  {
    name: "Massage Therapy",
    slug: "massage-therapy",
    description: "Professional massage services including Swedish, deep tissue, and therapeutic massage",
    isActive: true
  },
  {
    name: "Spa Services",
    slug: "spa-services",
    description: "Comprehensive spa treatments including facials, body scrubs, and relaxation therapies",
    isActive: true
  },
  {
    name: "Wellness Programs",
    slug: "wellness-programs",
    description: "Holistic wellness programs including meditation, mindfulness, and lifestyle coaching",
    isActive: true
  },
  {
    name: "Corporate Wellness",
    slug: "corporate-wellness",
    description: "Corporate wellness solutions including workplace stress management and team building activities",
    isActive: true
  },
  {
    name: "Physiotherapy",
    slug: "physiotherapy",
    description: "Physical therapy and rehabilitation services for injury recovery and mobility improvement",
    isActive: true
  },
  {
    name: "Yoga",
    slug: "yoga",
    description: "Various yoga styles including Hatha, Vinyasa, and Restorative yoga classes",
    isActive: true
  },
  {
    name: "Acupuncture",
    slug: "acupuncture",
    description: "Traditional Chinese medicine acupuncture for pain relief and wellness",
    isActive: true
  },
  {
    name: "Chiropractic Care",
    slug: "chiropractic-care",
    description: "Spinal adjustment and musculoskeletal treatment services",
    isActive: true
  },
  {
    name: "Nutrition Counseling",
    slug: "nutrition-counseling",
    description: "Personalized nutrition advice and dietary planning services",
    isActive: true
  },
  {
    name: "Meditation & Mindfulness",
    slug: "meditation-mindfulness",
    description: "Guided meditation sessions and mindfulness training programs",
    isActive: true
  },
  {
    name: "Pilates",
    slug: "pilates",
    description: "Core strengthening and flexibility improvement through Pilates exercises",
    isActive: true
  },
  {
    name: "Aromatherapy",
    slug: "aromatherapy",
    description: "Essential oil therapy for relaxation and therapeutic benefits",
    isActive: true
  },
  {
    name: "Reflexology",
    slug: "reflexology",
    description: "Foot reflexology and pressure point therapy services",
    isActive: true
  },
  {
    name: "Sports Massage",
    slug: "sports-massage",
    description: "Specialized massage techniques for athletes and sports injury prevention",
    isActive: true
  },
  {
    name: "Hot Stone Therapy",
    slug: "hot-stone-therapy",
    description: "Relaxing massage using heated stones for deep muscle tension relief",
    isActive: true
  },
  {
    name: "Cupping Therapy",
    slug: "cupping-therapy",
    description: "Traditional cupping treatment for muscle tension and circulation improvement",
    isActive: true
  },
  {
    name: "Reiki Healing",
    slug: "reiki-healing",
    description: "Energy healing and spiritual wellness sessions",
    isActive: true
  },
  {
    name: "Fitness Training",
    slug: "fitness-training",
    description: "Personal fitness training and workout program development",
    isActive: true
  }
];

async function seedServiceCategories() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  console.log('Using URI:', uri);
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('serenity_db');
    console.log('Using database:', db.databaseName);
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    const collection = db.collection('servicecategories');
    console.log('Using collection:', collection.collectionName);
    
    // Check if categories already exist
    const existingCount = await collection.countDocuments();
    
    console.log(`Found ${existingCount} existing service categories.`);
    
    if (existingCount > 0) {
      console.log('Deleting existing categories...');
      await collection.deleteMany({});
      console.log('Existing categories deleted.');
    }
    
    console.log('Proceeding with seeding...');
    
    // Add timestamps
    const categoriesWithTimestamps = defaultCategories.map(cat => ({
      ...cat,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert categories
    console.log('Inserting categories...');
    const result = await collection.insertMany(categoriesWithTimestamps);
    console.log(`Successfully inserted ${result.insertedCount} service categories:`);
    
    categoriesWithTimestamps.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });
    
    // Verify insertion
    const verifyCount = await collection.countDocuments();
    console.log(`Verification: Found ${verifyCount} documents in collection after insertion`);
    
    console.log('\nSeeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding service categories:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

seedServiceCategories();