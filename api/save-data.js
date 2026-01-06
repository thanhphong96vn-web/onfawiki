// Vercel serverless function để lưu dữ liệu vào MongoDB
const { MongoClient } = require('mongodb');

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Cache client để reuse connection
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority'
  });

  try {
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set');
      return res.status(500).json({ 
        error: 'Database not configured', 
        details: 'MONGODB_URI environment variable is missing' 
      });
    }

    const data = req.body;

    // Validate data structure
    if (!data.menus || !data.pages) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // Connect to database
    client = await connectToDatabase();
    const db = client.db('onfawiki');
    const collection = db.collection('wikiData');

    // Update hoặc insert document
    await collection.updateOne(
      { _id: 'main' },
      { 
        $set: {
          menus: data.menus,
          pages: data.pages,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('Data saved to MongoDB successfully');
    res.status(200).json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    
    // Clear cached client on error để reconnect lần sau
    if (cachedClient) {
      try {
        await cachedClient.close();
      } catch (closeError) {
        console.error('Error closing client:', closeError);
      }
      cachedClient = null;
    }
    
    res.status(500).json({ 
      error: 'Failed to save data', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

