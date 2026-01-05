// Script để migrate dữ liệu từ JSON file sang MongoDB
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI không được set trong .env file');
    process.exit(1);
  }

  const jsonFilePath = path.join(__dirname, '..', 'public', 'data', 'wiki-data.json');
  
  if (!fs.existsSync(jsonFilePath)) {
    console.error('❌ Không tìm thấy file:', jsonFilePath);
    process.exit(1);
  }

  try {
    // Đọc dữ liệu từ JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log('✅ Đã đọc dữ liệu từ JSON file');
    console.log(`   - Menus: ${jsonData.menus?.length || 0}`);
    console.log(`   - Pages: ${jsonData.pages?.length || 0}`);

    // Kết nối MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Đã kết nối MongoDB');

    const db = client.db('onfawiki');
    const collection = db.collection('wikiData');

    // Lưu dữ liệu vào MongoDB
    await collection.updateOne(
      { _id: 'main' },
      {
        $set: {
          menus: jsonData.menus || [],
          pages: jsonData.pages || [],
          migratedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('✅ Đã migrate dữ liệu vào MongoDB thành công!');
    
    // Verify
    const savedData = await collection.findOne({ _id: 'main' });
    console.log(`✅ Verified - Menus: ${savedData.menus?.length || 0}, Pages: ${savedData.pages?.length || 0}`);

    await client.close();
    console.log('✅ Migration hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi migrate:', error);
    process.exit(1);
  }
}

migrate();

