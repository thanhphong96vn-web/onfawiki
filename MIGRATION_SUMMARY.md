# Tóm tắt Migration từ JSON sang MongoDB

## Những thay đổi đã thực hiện

### 1. Database Setup
- ✅ Thêm MongoDB Atlas làm database chính
- ✅ Tạo MongoDB connection utility (`lib/mongodb.js`)
- ✅ Hỗ trợ cả local development và Vercel production

### 2. API Endpoints
- ✅ Tạo Vercel serverless functions:
  - `/api/get-data.js` - Lấy dữ liệu từ MongoDB
  - `/api/save-data.js` - Lưu dữ liệu vào MongoDB
- ✅ Cập nhật `server.js` để sử dụng MongoDB thay vì JSON file

### 3. Frontend Updates
- ✅ Cập nhật `src/utils/dataService.js`:
  - Tự động detect environment (localhost vs production)
  - Load dữ liệu từ API thay vì JSON file
  - Fallback về JSON file nếu API không khả dụng
  - Vẫn giữ localStorage làm cache

### 4. Configuration Files
- ✅ Cập nhật `package.json` với `mongodb` dependency
- ✅ Thêm `dotenv` cho local development
- ✅ Cập nhật `vercel.json` để handle API routes
- ✅ Tạo `.env.example` với hướng dẫn setup
- ✅ Cập nhật `.gitignore` để ignore `.env` files

### 5. Migration Script
- ✅ Tạo `scripts/migrate-to-mongodb.js` để migrate dữ liệu từ JSON sang MongoDB

### 6. Documentation
- ✅ Tạo `README_DATABASE.md` với hướng dẫn chi tiết setup MongoDB

## Cách sử dụng

### Local Development
1. Tạo file `.env` với `MONGODB_URI`
2. Chạy `npm install`
3. Chạy `npm run dev`

### Deploy lên Vercel
1. Thêm environment variable `MONGODB_URI` trong Vercel dashboard
2. Deploy như bình thường
3. API routes sẽ tự động hoạt động

### Migrate dữ liệu cũ
```bash
node scripts/migrate-to-mongodb.js
```

## Lưu ý quan trọng

1. **Environment Variables**: Phải set `MONGODB_URI` trong cả local và Vercel
2. **MongoDB Atlas**: Phải whitelist IP addresses (hoặc allow all 0.0.0.0/0)
3. **Backward Compatibility**: Code vẫn fallback về JSON file nếu API không khả dụng
4. **LocalStorage**: Vẫn được sử dụng làm cache để tăng performance

## Database Structure

- **Database**: `onfawiki`
- **Collection**: `wikiData`
- **Document**: `{ _id: 'main', menus: [...], pages: [...] }`

## Testing

Sau khi setup xong, test bằng cách:
1. Mở Admin Dashboard
2. Tạo/sửa một page
3. Kiểm tra MongoDB Atlas để xem dữ liệu đã được lưu chưa
4. Refresh trang và kiểm tra dữ liệu có load lại không

