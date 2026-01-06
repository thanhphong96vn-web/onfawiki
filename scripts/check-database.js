// Script để kiểm tra dữ liệu trong MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }

  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('onfawiki');
    const collection = db.collection('wikiData');

    // Lấy tất cả documents
    const documents = await collection.find({}).toArray();
    console.log('\n📊 Database Status:');
    console.log('Total documents:', documents.length);

    documents.forEach((doc, index) => {
      console.log(`\n📄 Document ${index + 1}:`);
      console.log('  _id:', doc._id);
      console.log('  Menus count:', doc.menus?.length || 0);
      console.log('  Pages count:', doc.pages?.length || 0);
      console.log('  Updated at:', doc.updatedAt || 'N/A');
      
      if (doc.pages && doc.pages.length > 0) {
        console.log('  First 5 pages:');
        doc.pages.slice(0, 5).forEach((page, i) => {
          console.log(`    ${i + 1}. ${page.id} - ${page.title}`);
        });
      }
    });

    // Kiểm tra document 'main'
    const mainDoc = await collection.findOne({ _id: 'main' });
    if (mainDoc) {
      console.log('\n✅ Main document found:');
      console.log('  Menus:', mainDoc.menus?.length || 0);
      console.log('  Pages:', mainDoc.pages?.length || 0);
    } else {
      console.log('\n⚠️ Main document not found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

checkDatabase();

