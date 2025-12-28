# Hướng dẫn chạy Server để lưu tự động vào JSON

## Cài đặt dependencies

```bash
npm install
```

## Chạy ứng dụng

Có 2 cách:

### Cách 1: Chạy cả server và React app cùng lúc (Khuyến nghị)

```bash
npm run dev
```

Lệnh này sẽ chạy:
- Express server trên port 3001 (để lưu JSON)
- React app trên port 3000

### Cách 2: Chạy riêng từng phần

**Terminal 1 - Chạy Express server:**
```bash
npm run server
```

**Terminal 2 - Chạy React app:**
```bash
npm start
```

## Cách hoạt động

1. Khi bạn tạo/sửa/xóa trang hoặc menu trong Admin Dashboard
2. Data sẽ được lưu vào:
   - **localStorage** (ngay lập tức)
   - **File JSON** (`public/data/wiki-data.json`) qua API (tự động)

3. File JSON sẽ được cập nhật tự động mỗi khi có thay đổi

## Lưu ý

- Server phải chạy để lưu vào file JSON
- Nếu server không chạy, data vẫn được lưu vào localStorage
- Khi deploy lên hosting, bạn cần setup Express server tương tự hoặc dùng cách export JSON thủ công

