# Environment Variables Setup

## Local Development

1. Tạo file `.env` trong thư mục root của project:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
```

2. File `.env` đã được thêm vào `.gitignore` để không commit lên Git.

## Vercel Production

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm biến môi trường:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0`
   - **Environment**: Production, Preview, Development (chọn tất cả)

3. Sau khi thêm, cần **Redeploy** project để áp dụng thay đổi.

## Kiểm tra

- **Local**: Chạy `npm run dev` và kiểm tra console log
- **Vercel**: Kiểm tra Function Logs trong Vercel Dashboard

## Troubleshooting

Nếu gặp lỗi "MongoDB URI not configured":

1. Kiểm tra `.env` file có tồn tại và có `MONGODB_URI` không
2. Kiểm tra Vercel Environment Variables đã được set chưa
3. Kiểm tra MongoDB Atlas IP whitelist đã allow `0.0.0.0/0` chưa
4. Redeploy lại project trên Vercel

