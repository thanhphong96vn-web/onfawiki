# Hướng dẫn Deploy Website lên Hosting

## Cách hoạt động

- **localStorage**: Chỉ lưu tạm thời trên trình duyệt của bạn để tăng tốc độ
- **File JSON**: Là nguồn dữ liệu chính trên server, tất cả người dùng sẽ load từ file này

## Quy trình Deploy

### Bước 1: Quản lý dữ liệu trong Admin Dashboard

1. Vào Admin Dashboard: `http://localhost:3000/#admin`
2. Thêm/sửa/xóa trang và menu theo nhu cầu
3. Dữ liệu sẽ được lưu vào localStorage tự động

### Bước 2: Export dữ liệu ra file JSON

1. Trong Admin Dashboard, click nút **"Export JSON để Deploy"**
2. File `wiki-data.json` sẽ được tải về máy của bạn

### Bước 3: Copy file JSON vào project

1. Mở file `wiki-data.json` vừa tải về
2. Copy toàn bộ nội dung
3. Paste vào file `public/data/wiki-data.json` trong project
4. Lưu file

### Bước 4: Build và Deploy

```bash
# Build project
npm run build

# Upload thư mục build/ lên hosting của bạn
```

### Bước 5: Kiểm tra

Sau khi deploy, tất cả người dùng sẽ load dữ liệu từ file `public/data/wiki-data.json` trên server.

## Lưu ý quan trọng

- **localStorage chỉ để cache**: Dữ liệu trong localStorage chỉ để tăng tốc độ load, không phải để deploy
- **File JSON là nguồn chính**: Khi deploy, website sẽ load từ `public/data/wiki-data.json`
- **Mỗi lần thay đổi dữ liệu**: Cần export lại JSON và copy vào `public/data/wiki-data.json` trước khi deploy

## Workflow đề xuất

1. **Phát triển**: Sử dụng Admin Dashboard để quản lý dữ liệu (lưu vào localStorage)
2. **Export**: Khi hoàn thành, export ra file JSON
3. **Deploy**: Copy file JSON vào `public/data/wiki-data.json` và build/deploy
4. **Cập nhật**: Khi cần cập nhật, lặp lại từ bước 1

