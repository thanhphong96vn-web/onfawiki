// Vercel serverless function để lấy dữ liệu từ MongoDB
const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('onfawiki');
    const collection = db.collection('wikiData');

    // Lấy document đầu tiên (hoặc tạo mới nếu chưa có)
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
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

