const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn để xử lý dữ liệu lớn
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_FILE = path.join(__dirname, 'public', 'data', 'wiki-data.json');

// API endpoint để lưu data vào JSON file
app.post('/api/save-data', (req, res) => {
  try {
    const data = req.body;
    
    // Validate data structure
    if (!data.menus || !data.pages) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }
    
    // Ghi vào file JSON
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('Data saved to', DATA_FILE);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});

// API endpoint để đọc data từ JSON file
app.get('/api/get-data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      res.json(data);
    } else {
      res.json({ menus: [], pages: [] });
    }
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Data API server running on http://localhost:${PORT}`);
});

