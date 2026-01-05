// Vercel serverless function để lưu dữ liệu vào MongoDB
const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Validate data structure
    if (!data.menus || !data.pages) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    const client = await clientPromise;
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
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
}

