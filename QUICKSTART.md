# Quick Start Guide

## Chạy dự án sau khi clone từ GitHub

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd qlts
```

### Bước 2: Chạy Docker Compose
```bash
docker-compose up -d
```

### Bước 3: Đợi các services khởi động
Kiểm tra trạng thái:
```bash
docker-compose ps
```

Xem logs nếu cần:
```bash
docker-compose logs -f
```

### Bước 4: Truy cập ứng dụng
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000/api/health

### Tài khoản đăng nhập mặc định
- **Username**: admin
- **Password**: password

## Troubleshooting

### Nếu backend không khởi động được:
```bash
# Xem logs backend
docker-compose logs backend

# Rebuild backend
docker-compose up -d --build backend
```

### Nếu database không kết nối được:
```bash
# Xem logs database
docker-compose logs postgres

# Kiểm tra database đã sẵn sàng
docker-compose exec postgres pg_isready -U postgres
```

### Nếu frontend không hiển thị:
```bash
# Xem logs frontend
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Xóa tất cả và bắt đầu lại:
```bash
docker-compose down -v
docker-compose up -d --build
```

