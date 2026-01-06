const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load .env file explicitly - FORCE load với nhiều phương pháp
const envPath = path.resolve(__dirname, '.env');
console.log('=== Loading .env file ===');
console.log('Looking for .env at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

// Method 1: Try dotenv với nhiều cách
require('dotenv').config(); // Load từ root
require('dotenv').config({ path: envPath }); // Load với explicit path
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); // Load từ cwd

// Method 2: FORCE đọc file trực tiếp và set vào process.env
if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI not found after dotenv, FORCE reading .env directly...');
  try {
    if (fs.existsSync(envPath)) {
      // Thử đọc với nhiều encoding
      let envContent;
      try {
        // Thử UTF-8 trước
        envContent = fs.readFileSync(envPath, 'utf8');
        // Nếu có BOM hoặc ký tự lạ, thử UTF-16
        if (envContent.charCodeAt(0) === 0xFEFF || envContent.includes('\u0000')) {
          console.log('Detected UTF-16 encoding, converting...');
          envContent = fs.readFileSync(envPath, 'utf16le');
          // Remove BOM nếu có
          if (envContent.charCodeAt(0) === 0xFEFF) {
            envContent = envContent.substring(1);
          }
        }
      } catch (e) {
        // Nếu UTF-8 fail, thử UTF-16
        console.log('UTF-8 failed, trying UTF-16...');
        envContent = fs.readFileSync(envPath, 'utf16le');
        if (envContent.charCodeAt(0) === 0xFEFF) {
          envContent = envContent.substring(1);
        }
      }
      
      console.log('File content length:', envContent.length);
      console.log('First 50 chars:', envContent.substring(0, 50));
      
      // Handle both \n and \r\n line endings
      const lines = envContent.split(/\r?\n/);
      console.log('Total lines in .env:', lines.length);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // Tìm dấu = đầu tiên
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmed.substring(0, equalIndex).trim();
            const value = trimmed.substring(equalIndex + 1).trim();
            console.log(`Found key: ${key}, value length: ${value.length}`);
            
            if (key === 'MONGODB_URI') {
              process.env.MONGODB_URI = value;
              console.log('✅✅✅ FORCE loaded MONGODB_URI from .env file');
              console.log('Value length:', value.length);
              console.log('Value starts with:', value.substring(0, 30));
              break;
            }
          }
        }
      }
    } else {
      console.error('❌ .env file does not exist at:', envPath);
    }
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI still not found after reading .env file');
      if (fs.existsSync(envPath)) {
        const preview = fs.readFileSync(envPath, 'utf8').substring(0, 200);
        console.error('File content preview:', preview);
      }
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
    console.error('Error stack:', err.stack);
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
    // CRITICAL: Kiểm tra và load lại MONGODB_URI nếu chưa có
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ MONGODB_URI not found in request handler, trying to reload...');
      // Thử load lại từ .env
      const envPath = path.resolve(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('MONGODB_URI=')) {
            const value = trimmed.substring('MONGODB_URI='.length).trim();
            process.env.MONGODB_URI = value;
            console.log('✅ Reloaded MONGODB_URI from .env file');
            break;
          }
        }
      }
    }
    
    // Kiểm tra lại sau khi reload
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI still not found after reload attempt');
      console.error('Current env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      return res.status(500).json({ 
        error: 'Failed to read data', 
        details: 'MongoDB URI not configured. Please check .env file.',
        debug: {
          envPath: path.resolve(__dirname, '.env'),
          envExists: fs.existsSync(path.resolve(__dirname, '.env')),
          cwd: process.cwd(),
          __dirname: __dirname
        }
      });
    }

    if (!db || !client?.isConnected?.()) {
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

