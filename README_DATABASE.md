# Hướng dẫn Setup Database cho ONFA Wiki

Dự án này đã được migrate từ JSON file storage sang MongoDB để có thể deploy lên Vercel.

## Bước 1: Tạo MongoDB Atlas Account

1. Truy cập https://www.mongodb.com/cloud/atlas
2. Đăng ký tài khoản miễn phí (Free tier)
3. Tạo một cluster mới (chọn free tier M0)

## Bước 2: Lấy Connection String

1. Trong MongoDB Atlas dashboard, click vào "Connect"
2. Chọn "Connect your application"
3. Copy connection string (sẽ có dạng: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)
4. Thay thế `<password>` bằng password của bạn và `<username>` bằng username bạn đã tạo

## Bước 3: Setup Environment Variables

### Local Development

1. Tạo file `.env` trong thư mục root của project:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

2. Đảm bảo file `.env` đã được thêm vào `.gitignore` (đã có sẵn)

### Vercel Deployment

1. Vào Vercel dashboard của project
2. Vào Settings > Environment Variables
3. Thêm biến mới:
   - **Name**: `MONGODB_URI`
   - **Value**: Connection string từ MongoDB Atlas
   - **Environment**: Production, Preview, Development (chọn tất cả)

## Bước 4: Cấu hình MongoDB Atlas Network Access

1. Trong MongoDB Atlas dashboard, vào "Network Access"
2. Click "Add IP Address"
3. Chọn "Allow Access from Anywhere" (0.0.0.0/0) để cho phép Vercel kết nối
   - Hoặc thêm IP cụ thể của Vercel nếu bạn muốn bảo mật hơn

## Bước 5: Cài đặt Dependencies

```bash
npm install
```

## Bước 6: Chạy Local Development

```bash
npm run dev
```

Server sẽ tự động kết nối với MongoDB và tạo database `onfawiki` với collection `wikiData` khi có dữ liệu đầu tiên.

## Migration Data từ JSON

Nếu bạn đã có dữ liệu trong file `public/data/wiki-data.json`, bạn có thể import vào MongoDB bằng cách:

1. Chạy script migration (tạo file `scripts/migrate-to-mongodb.js` nếu cần)
2. Hoặc sử dụng MongoDB Compass để import JSON file trực tiếp

## Kiểm tra

Sau khi setup xong, bạn có thể:
- Tạo/sửa/xóa pages và menus từ Admin Dashboard
- Dữ liệu sẽ được lưu vào MongoDB thay vì JSON file
- Khi deploy lên Vercel, dữ liệu sẽ được lưu và load từ MongoDB

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra lại connection string trong `.env`
- Đảm bảo IP address đã được whitelist trong MongoDB Atlas
- Kiểm tra username và password có đúng không

### Lỗi khi deploy Vercel
- Đảm bảo environment variable `MONGODB_URI` đã được set trong Vercel
- Kiểm tra lại connection string không có ký tự đặc biệt cần encode

