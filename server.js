const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

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
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment variables');
    throw new Error('MongoDB URI not configured');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('onfawiki');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
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

