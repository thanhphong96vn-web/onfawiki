# ✅ Setup MongoDB Hoàn Tất!

## Đã hoàn thành

1. ✅ **MongoDB Connection**: Đã kết nối thành công với MongoDB Atlas
2. ✅ **Migration Data**: Đã import dữ liệu từ JSON vào MongoDB
   - 19 menus
   - 62 pages
3. ✅ **Environment Variables**: File `.env` đã được tạo với connection string

## Connection String

```
mongodb+srv://thanhphong96vn_db_user:Ty6F4L4SIInn8wJo@cluster0.280fgpo.mongodb.net/?appName=Cluster0
```

## Database Structure

- **Database**: `onfawiki`
- **Collection**: `wikiData`
- **Document ID**: `main`

## Bước tiếp theo

### 1. Test Local Development

```bash
npm run dev
```

Sau đó:
- Mở http://localhost:3000
- Vào Admin Dashboard
- Tạo/sửa một page để test
- Kiểm tra MongoDB Atlas để xem dữ liệu đã được lưu

### 2. Setup Vercel Deployment

1. Vào Vercel Dashboard > Project Settings > Environment Variables
2. Thêm biến mới:
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://thanhphong96vn_db_user:Ty6F4L4SIInn8wJo@cluster0.280fgpo.mongodb.net/?appName=Cluster0`
   - **Environment**: Chọn tất cả (Production, Preview, Development)

3. Deploy lại project:
   ```bash
   git add .
   git commit -m "Migrate to MongoDB"
   git push
   ```

### 3. Kiểm tra MongoDB Atlas Network Access

Đảm bảo trong MongoDB Atlas:
- **Network Access** đã allow IP của bạn (hoặc 0.0.0.0/0 để allow tất cả)
- **Database User** đã được tạo với đúng username/password

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG**: 
- File `.env` đã được thêm vào `.gitignore` để không commit lên Git
- Khi deploy lên Vercel, phải thêm `MONGODB_URI` vào Environment Variables trong Vercel Dashboard
- Không share connection string này công khai

## Troubleshooting

Nếu gặp lỗi kết nối:

1. **Kiểm tra MongoDB Atlas Network Access**
   - Vào MongoDB Atlas > Network Access
   - Đảm bảo IP của bạn đã được whitelist

2. **Kiểm tra Connection String**
   - Username và password phải đúng
   - Không có khoảng trắng thừa

3. **Kiểm tra Environment Variables**
   - Local: File `.env` phải có `MONGODB_URI`
   - Vercel: Environment Variables trong dashboard phải có `MONGODB_URI`

## Test API Endpoints

Sau khi chạy `npm run dev`, bạn có thể test:

- **GET**: http://localhost:3001/api/get-data
- **POST**: http://localhost:3001/api/save-data (với body JSON)

Hoặc khi deploy lên Vercel:
- **GET**: https://your-domain.vercel.app/api/get-data
- **POST**: https://your-domain.vercel.app/api/save-data

