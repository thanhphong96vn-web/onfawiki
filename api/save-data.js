// Vercel serverless function để lưu dữ liệu vào MongoDB
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Load environment variables - luôn load dotenv để đảm bảo hoạt động trong mọi môi trường
// dotenv sẽ không override nếu env vars đã tồn tại (như trong Vercel)
require('dotenv').config();

// Fallback: Nếu vẫn chưa có MONGODB_URI, thử đọc trực tiếp từ .env file
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            if (key === 'MONGODB_URI' && !process.env.MONGODB_URI) {
              process.env.MONGODB_URI = value;
              console.log('✅ Loaded MONGODB_URI from .env file');
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Warning: Could not read .env file:', err.message);
  }
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
    // Debug: Log environment info
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      MONGODB_URI_exists: !!process.env.MONGODB_URI,
      MONGODB_URI_length: process.env.MONGODB_URI?.length || 0,
      cwd: process.cwd()
    });
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      return res.status(500).json({ 
        error: 'Database not configured', 
        details: 'MONGODB_URI environment variable is missing. Please set it in Vercel Environment Variables or .env file.',
        debug: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: !!process.env.VERCEL,
          cwd: process.cwd()
        }
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

