const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load .env file explicitly - try multiple methods
const envPath = path.resolve(__dirname, '.env');
console.log('=== Loading .env file ===');
console.log('Looking for .env at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

// Method 1: Try dotenv with explicit path
require('dotenv').config({ path: envPath });

// Method 2: If still not loaded, try reading file directly
if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI not found, trying to read .env directly...');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Handle both \n and \r\n line endings
    const lines = envContent.split(/\r?\n/);
    console.log('Total lines in .env:', lines.length);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          if (key === 'MONGODB_URI') {
            process.env.MONGODB_URI = value;
            console.log('✅ Successfully loaded MONGODB_URI from .env file');
            console.log('Value length:', value.length);
            break;
          }
        }
      }
    }
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI still not found after reading .env file');
      console.error('File content preview:', envContent.substring(0, 100));
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

// Debug: Log environment variables
console.log('=== Server Startup Debug ===');
console.log('Current directory:', __dirname);
console.log('Working directory:', process.cwd());
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI loaded successfully!');
  console.log('MONGODB_URI length:', process.env.MONGODB_URI.length);
  console.log('MONGODB_URI starts with:', process.env.MONGODB_URI.substring(0, 30) + '...');
} else {
  console.error('❌ MONGODB_URI is NOT loaded!');
  console.error('Please check .env file exists and contains MONGODB_URI');
}
console.log('===========================');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn để xử lý dữ liệu lớn
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connection
let client;
let db;

async function connectToMongoDB() {
  // Log để debug
  console.log('=== connectToMongoDB Debug ===');
  console.log('Checking MONGODB_URI...');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  // Fallback: Try to read from .env file directly if not set
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not in process.env, trying to read .env file...');
    try {
      const envPath = path.resolve(__dirname, '.env');
      console.log('Reading .env from:', envPath);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('File content length:', envContent.length);
        console.log('First 100 chars:', envContent.substring(0, 100));
        
        // Try multiple regex patterns
        let match = envContent.match(/MONGODB_URI\s*=\s*(.+?)(?:\r?\n|$)/);
        if (!match) {
          match = envContent.match(/MONGODB_URI=(.+)/);
        }
        if (!match) {
          // Try line by line
          const lines = envContent.split(/\r?\n/);
          for (const line of lines) {
            if (line.trim().startsWith('MONGODB_URI=')) {
              const value = line.substring('MONGODB_URI='.length).trim();
              process.env.MONGODB_URI = value;
              console.log('✅ Loaded MONGODB_URI from line:', value.substring(0, 30) + '...');
              break;
            }
          }
        } else {
          process.env.MONGODB_URI = match[1].trim();
          console.log('✅ Loaded MONGODB_URI from regex match');
        }
      } else {
        console.error('❌ .env file does not exist at:', envPath);
      }
    } catch (err) {
      console.error('Error reading .env:', err);
    }
  }
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is still not set after all attempts');
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('================================');
    throw new Error('MongoDB URI not configured');
  }
  
  console.log('✅ MONGODB_URI found, length:', process.env.MONGODB_URI.length);
  console.log('First 30 chars:', process.env.MONGODB_URI.substring(0, 30));
  console.log('==============================');

  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    await client.connect();
    db = client.db('onfawiki');
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Initialize MongoDB connection
connectToMongoDB().catch(console.error);

// API endpoint để lưu data vào MongoDB
app.post('/api/save-data', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate data structure
    if (!data.menus || !data.pages) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    if (!db) {
      await connectToMongoDB();
    }

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
    
    console.log('Data saved to MongoDB');
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});

// API endpoint để đọc data từ MongoDB
app.get('/api/get-data', async (req, res) => {
  try {
    // Kiểm tra MONGODB_URI trước
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in request handler');
      return res.status(500).json({ 
        error: 'Failed to read data', 
        details: 'MongoDB URI not configured' 
      });
    }

    if (!db) {
      await connectToMongoDB();
    }

    const collection = db.collection('wikiData');
    let data = await collection.findOne({ _id: 'main' });

    if (!data) {
      // Nếu chưa có dữ liệu, tạo document mặc định
      const defaultData = {
        _id: 'main',
        menus: [],
        pages: []
      };
      await collection.insertOne(defaultData);
      data = defaultData;
    }

    // Loại bỏ _id trước khi trả về
    const { _id, ...result } = data;
    res.json(result);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Data API server running on http://localhost:${PORT}`);
});

