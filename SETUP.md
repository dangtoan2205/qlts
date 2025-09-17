# 🚀 Hướng dẫn cài đặt và chạy dự án QLTS

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **PostgreSQL**: >= 12.0 (hoặc Docker)
- **Git**: Để clone repository

## 🔧 Cài đặt Node.js và npm

### Windows:
1. Truy cập: https://nodejs.org/
2. Tải phiên bản LTS (Long Term Support)
3. Chạy file installer và làm theo hướng dẫn
4. Kiểm tra cài đặt:
   ```bash
   node --version
   npm --version
   ```

### macOS:
```bash
# Sử dụng Homebrew
brew install node

# Hoặc tải từ nodejs.org
```

### Linux (Ubuntu/Debian):
```bash
# Cập nhật package list
sudo apt update

# Cài đặt Node.js và npm
sudo apt install nodejs npm

# Kiểm tra phiên bản
node --version
npm --version
```

## 🐘 Cài đặt PostgreSQL

### Tùy chọn 1: Cài đặt trực tiếp

#### Windows:
1. Truy cập: https://www.postgresql.org/download/windows/
2. Tải PostgreSQL 15 hoặc phiên bản mới nhất
3. Chạy installer và làm theo hướng dẫn
4. **Quan trọng**: Ghi nhớ mật khẩu cho user `postgres`

#### macOS:
```bash
# Sử dụng Homebrew
brew install postgresql
brew services start postgresql

# Tạo database
createdb qlts_assets
```

#### Linux (Ubuntu/Debian):
```bash
# Cài đặt PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Khởi động service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database
sudo -u postgres createdb qlts_assets
```

### Tùy chọn 2: Sử dụng Docker (Khuyến nghị)

#### Cài đặt Docker:
1. Truy cập: https://www.docker.com/products/docker-desktop
2. Tải và cài đặt Docker Desktop
3. Khởi động Docker Desktop

#### Chạy PostgreSQL bằng Docker:
```bash
# Clone project về máy
git clone <repository-url>
cd qlts

# Chạy PostgreSQL bằng Docker Compose
docker-compose up -d

# Kiểm tra container đang chạy
docker ps
```

## 📥 Clone và cài đặt dự án

### 1. Clone repository:
```bash
git clone <repository-url>
cd qlts
```

### 2. Cài đặt dependencies:
```bash
# Cài đặt tất cả dependencies (root, backend, frontend)
npm run install-all

# Hoặc cài đặt từng phần:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Cấu hình môi trường:

#### Tạo file `.env` trong thư mục `backend`:
```bash
# Windows
copy backend\env.example backend\.env

# macOS/Linux
cp backend/env.example backend/.env
```

#### Chỉnh sửa file `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qlts_assets
DB_USER=postgres
DB_PASSWORD=password

# JWT Secret
JWT_SECRET=qlts_jwt_secret_key_2024

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Lưu ý**: Thay `password` bằng mật khẩu PostgreSQL của bạn.

### 4. Khởi tạo database:

#### Nếu sử dụng PostgreSQL trực tiếp:
```bash
# Tạo database
createdb qlts_assets

# Chạy schema
psql -U postgres -d qlts_assets -f backend/database/schema.sql
```

#### Nếu sử dụng Docker:
```bash
# Database sẽ được tạo tự động khi chạy docker-compose
# Schema sẽ được chạy tự động
```

### 5. Khởi tạo database schema:
```bash
cd backend
npm run init-db
```

## 🚀 Chạy dự án

### Cách 1: Chạy tất cả services cùng lúc (Khuyến nghị):
```bash
# Từ thư mục gốc của dự án
npm run dev
```

### Cách 2: Chạy riêng lẻ:

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

#### Terminal 3 - PostgreSQL (nếu dùng Docker):
```bash
docker-compose up -d
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Tài khoản mặc định:
- **Username**: `admin`
- **Password**: `password`

## 🔧 Khắc phục sự cố

### Lỗi "Cannot find module":
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

### Lỗi kết nối database:
1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. Kiểm tra Docker (nếu dùng):
   ```bash
   docker ps
   docker-compose logs postgres
   ```

3. Kiểm tra cấu hình trong `backend/.env`

### Lỗi port đã được sử dụng:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :3000
lsof -i :5000

# Dừng process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Lỗi "EADDRINUSE":
```bash
# Dừng tất cả Node.js processes
# Windows
taskkill /f /im node.exe

# macOS/Linux
pkill -f node
```

## 📁 Cấu trúc dự án

```
qlts/
├── backend/                 # Backend Node.js
│   ├── config/             # Cấu hình database
│   ├── database/           # Database schema
│   ├── middleware/         # Middleware functions
│   ├── routes/             # API routes
│   ├── scripts/            # Scripts tiện ích
│   ├── server.js           # Server entry point
│   ├── package.json
│   └── .env                # Environment variables
├── frontend/               # Frontend React.js
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   └── package.json
├── docker-compose.yml      # Docker configuration
├── package.json            # Root package.json
├── README.md               # Hướng dẫn chính
└── SETUP.md               # Hướng dẫn cài đặt (file này)
```

## 🛠️ Scripts có sẵn

### Root level:
- `npm run dev` - Chạy cả backend và frontend
- `npm run server` - Chỉ chạy backend
- `npm run client` - Chỉ chạy frontend
- `npm run install-all` - Cài đặt tất cả dependencies

### Backend:
- `npm start` - Chạy production
- `npm run dev` - Chạy development với nodemon
- `npm run init-db` - Khởi tạo database schema

### Frontend:
- `npm start` - Chạy development server
- `npm run build` - Build production
- `npm test` - Chạy tests

## 🐳 Docker Commands

```bash
# Khởi động PostgreSQL
docker-compose up -d

# Dừng PostgreSQL
docker-compose down

# Xem logs
docker-compose logs postgres

# Khởi động lại
docker-compose restart
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

1. **Logs backend**: Terminal chạy backend
2. **Logs frontend**: Terminal chạy frontend
3. **Browser Console**: F12 → Console tab
4. **Network tab**: F12 → Network tab để xem API calls

## 🎯 Tính năng chính

- ✅ **Quản lý tài sản IT**: Case PC, màn hình, bàn phím, chuột, tai nghe, laptop, MacBook
- ✅ **Quản lý nhân viên**: Thông tin chi tiết nhân viên
- ✅ **Bàn giao tài sản**: Workflow bàn giao và trả tài sản
- ✅ **Lịch sử sử dụng**: Theo dõi ai đã sử dụng tài sản nào
- ✅ **Dashboard**: Thống kê tổng quan
- ✅ **Authentication**: Đăng nhập bảo mật với JWT

## 🐳 Chạy ứng dụng với Docker (Khuyến nghị)

### Yêu cầu Docker:
- **Docker**: >= 20.0.0
- **Docker Compose**: >= 2.0.0

### Cài đặt Docker:

#### Windows:
1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop
3. Kiểm tra: `docker --version`

#### macOS:
```bash
# Sử dụng Homebrew
brew install --cask docker

# Hoặc tải từ docker.com
```

#### Linux (Ubuntu/Debian):
```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo apt install docker-compose-plugin

# Thêm user vào docker group
sudo usermod -aG docker $USER
```

### Chạy ứng dụng:

#### Cách 1: Chạy tất cả services (Khuyến nghị)
```bash
# Clone repository
git clone <repository-url>
cd qlts

# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

#### Cách 2: Chạy từng service riêng lẻ
```bash
# 1. Chạy database
docker-compose up -d postgres

# 2. Chạy backend
docker-compose up -d backend

# 3. Chạy frontend
docker-compose up -d frontend
```

### Truy cập ứng dụng:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Tài khoản mặc định:
- **Username**: `admin`
- **Password**: `password`

**👉 Xem file [DOCKER.md](./DOCKER.md) để có hướng dẫn Docker chi tiết**

Chúc bạn cài đặt thành công! 🚀
