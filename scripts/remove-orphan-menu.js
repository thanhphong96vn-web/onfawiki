const { MongoClient } = require('mongodb');
require('dotenv').config();

async function removeOrphanMenu() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('onfawiki');
    const collection = db.collection('wikiData');

    // Lấy dữ liệu hiện tại
    const data = await collection.findOne({ _id: 'main' });
    
    if (!data) {
      console.error('❌ No data found');
      process.exit(1);
    }

    console.log('📊 Current data:');
    console.log(`   - Menus: ${data.menus?.length || 0}`);
    console.log(`   - Pages: ${data.pages?.length || 0}`);

    // Tìm menu "Tài khoản"
    const taiKhoanMenu = data.menus.find(m => m.id === 'tài-khoản');
    
    if (!taiKhoanMenu) {
      console.error('❌ Menu "Tài khoản" not found');
      process.exit(1);
    }

    console.log(`\n📋 Menu "Tài khoản" có ${taiKhoanMenu.children?.length || 0} children`);

    // Tìm và xóa menu child "các-gói-duy-trì-maintenance-plans"
    const orphanId = 'các-gói-duy-trì-maintenance-plans';
    const orphanIndex = taiKhoanMenu.children?.findIndex(c => c.id === orphanId);
    
    if (orphanIndex === -1 || orphanIndex === undefined) {
      console.log('⚠️ Menu child "các-gói-duy-trì-maintenance-plans" không tìm thấy trong children');
    } else {
      console.log(`\n🗑️ Xóa menu child "${orphanId}" khỏi menu "Tài khoản"...`);
      taiKhoanMenu.children.splice(orphanIndex, 1);
      console.log(`✅ Đã xóa. Còn lại ${taiKhoanMenu.children.length} children`);
    }

    // Kiểm tra xem có page nào với id này không
    const orphanPage = data.pages.find(p => p.id === orphanId);
    if (orphanPage) {
      console.log(`\n⚠️ Có page với id "${orphanId}" trong database. Bạn có muốn xóa page này không?`);
      console.log(`   Page title: ${orphanPage.title}`);
    } else {
      console.log(`\n✅ Không có page nào với id "${orphanId}" trong database (đúng như mong đợi)`);
    }

    // Cập nhật database
    await collection.updateOne(
      { _id: 'main' },
      {
        $set: {
          menus: data.menus,
          updatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Đã cập nhật database thành công!');
    
    // Verify
    const updatedData = await collection.findOne({ _id: 'main' });
    const updatedTaiKhoanMenu = updatedData.menus.find(m => m.id === 'tài-khoản');
    console.log(`\n✅ Verified - Menu "Tài khoản" hiện có ${updatedTaiKhoanMenu.children?.length || 0} children`);

    await client.close();
    console.log('\n✅ Hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

removeOrphanMenu();

