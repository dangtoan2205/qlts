# QLTS - Quản lý tài sản IT

Hệ thống quản lý tài sản IT với React frontend và Node.js backend.

## Yêu cầu hệ thống

- Docker >= 20.10
- Docker Compose >= 2.0

## Cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd qlts
```

### 2. Chạy với Docker Compose

```bash
docker-compose up -d
```

Lệnh này sẽ:
- Tạo và khởi động PostgreSQL database
- Build và khởi động Backend API
- Build và khởi động Frontend React app

### 3. Truy cập ứng dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### 4. Tài khoản mặc định

- **Username**: admin
- **Password**: password

## Cấu trúc dự án

```
qlts/
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── docker-compose.yml
└── README.md
```

## Các lệnh Docker hữu ích

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend

# Chỉ database
docker-compose logs -f postgres
```

### Dừng services
```bash
docker-compose down
```

### Dừng và xóa volumes (xóa dữ liệu database)
```bash
docker-compose down -v
```

### Rebuild containers
```bash
docker-compose up -d --build
```

### Xem trạng thái services
```bash
docker-compose ps
```

## Cấu hình môi trường

Các biến môi trường có thể được thay đổi trong file `docker-compose.yml`:

- `POSTGRES_PASSWORD`: Mật khẩu database
- `JWT_SECRET`: Secret key cho JWT (nên thay đổi trong production)
- `DB_*`: Cấu hình kết nối database

## Troubleshooting

### Backend không kết nối được database
- Kiểm tra xem postgres container đã chạy chưa: `docker-compose ps`
- Kiểm tra logs: `docker-compose logs postgres`
- Đảm bảo backend đợi database sẵn sàng (đã có healthcheck)

### Frontend không kết nối được backend
- Kiểm tra backend đã chạy: `docker-compose ps`
- Kiểm tra nginx config trong `frontend/nginx.conf`
- Kiểm tra logs: `docker-compose logs frontend`

### Port đã được sử dụng
- Thay đổi port trong `docker-compose.yml` nếu port 80, 5000, hoặc 5432 đã được sử dụng

## Development

### Chạy development mode (không dùng Docker)

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## License

MIT
