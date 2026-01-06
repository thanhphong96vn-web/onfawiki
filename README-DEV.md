# Development Setup

## Cách chạy Development

### Option 1: Dùng Vercel CLI (Khuyến nghị)

1. Cài đặt Vercel CLI:
```bash
npm install -g vercel
```

2. Login vào Vercel:
```bash
vercel login
```

3. Link project với Vercel:
```bash
vercel link
```

4. Chạy development server:
```bash
npm run dev
# hoặc
vercel dev
```

Vercel sẽ tự động:
- Chạy React app trên port 3000
- Chạy serverless functions locally
- Load environment variables từ `.env` và Vercel

### Option 2: Dùng React Scripts (Chỉ frontend)

Nếu chỉ muốn chạy frontend mà không cần API:

```bash
npm start
```

**Lưu ý**: API sẽ không hoạt động trong mode này. Chỉ dùng để test UI.

## Environment Variables

Tạo file `.env` trong root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
```

## Production

Deploy lên Vercel:
```bash
vercel --prod
```

Hoặc push code lên Git và Vercel sẽ tự động deploy.

**Quan trọng**: Đảm bảo đã set `MONGODB_URI` trong Vercel Environment Variables!

