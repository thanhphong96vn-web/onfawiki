// Script để sync data từ localStorage ra file JSON
// Chạy: node scripts/sync-data.js

const fs = require('fs');
const path = require('path');

// Đọc file JSON từ public/data/wiki-data.json
const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'wiki-data.json');

console.log('📋 Script sync data từ localStorage ra file JSON\n');

// Hướng dẫn sử dụng
console.log('📝 Hướng dẫn:');
console.log('1. Mở trình duyệt và vào Admin Dashboard');
console.log('2. Bấm nút "Export JSON để Deploy"');
console.log('3. File wiki-data.json sẽ được tải về');
console.log('4. Copy file đó vào public/data/wiki-data.json');
console.log('5. Hoặc chạy server (npm run dev) và bấm Export để tự động sync\n');

// Kiểm tra file có tồn tại không
if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log('✅ File JSON hiện tại:');
  console.log(`   - Menus: ${data.menus?.length || 0}`);
  console.log(`   - Pages: ${data.pages?.length || 0}`);
  console.log(`   - Location: ${DATA_FILE}\n`);
} else {
  console.log('⚠️  File JSON chưa tồn tại');
  console.log(`   Tạo file mới tại: ${DATA_FILE}\n`);
}

console.log('💡 Tip: Để tự động sync khi có thay đổi, chạy: npm run dev');
console.log('   Sau đó bấm Export trong Admin Dashboard sẽ tự động lưu vào file JSON');

