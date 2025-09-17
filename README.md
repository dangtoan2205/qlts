# QLTS - Phần mềm quản lý tài sản IT

Hệ thống quản lý tài sản IT cho bộ phận IT công ty, được xây dựng với Node.js backend và React.js frontend.

## 🚀 Tính năng chính

### Quản lý tài sản
- ✅ Quản lý các loại tài sản: Case PC, màn hình, bàn phím, chuột, tai nghe, laptop, MacBook, thiết bị khác
- ✅ Mã tài sản riêng cho từng thiết bị
- ✅ Theo dõi thông tin chi tiết: thương hiệu, model, serial number, giá mua, vị trí
- ✅ Quản lý trạng thái: khả dụng, đã bàn giao, bảo trì, ngừng sử dụng

### Quản lý nhân viên
- ✅ Quản lý thông tin nhân viên với mã nhân viên riêng
- ✅ Thông tin liên hệ: email, số điện thoại, phòng ban, chức vụ

### Bàn giao tài sản
- ✅ Bàn giao tài sản cho nhân viên với ngày bàn giao
- ✅ Theo dõi lịch sử bàn giao và trả tài sản
- ✅ Quản lý trạng thái bàn giao: đang sử dụng, đã trả

### Dashboard & Báo cáo
- ✅ Tổng quan thống kê tài sản và nhân viên
- ✅ Theo dõi tình trạng sử dụng tài sản
- ✅ Lịch sử bàn giao gần đây

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI library
- **Ant Design** - UI components
- **React Router** - Routing
- **Axios** - HTTP client
- **Day.js** - Date manipulation

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm >= 8.0.0

## 🚀 Hướng dẫn cài đặt nhanh

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- PostgreSQL >= 12.0 (hoặc Docker)
- npm >= 8.0.0

### Cài đặt nhanh

#### Cách 1: Sử dụng Docker (Khuyến nghị)
```bash
# 1. Clone repository
git clone <repository-url>
cd qlts

# 2. Chạy với Docker
docker-compose up -d

# 3. Truy cập ứng dụng
# Frontend: http://localhost
# Backend: http://localhost:5000
```

#### Cách 2: Cài đặt thủ công
```bash
# 1. Clone repository
git clone <repository-url>
cd qlts

# 2. Cài đặt dependencies
npm run install-all

# 3. Cấu hình database
# Tạo database: createdb qlts_assets
# Chạy schema: psql -U postgres -d qlts_assets -f backend/database/schema.sql

# 4. Cấu hình environment
cp backend/env.example backend/.env
# Chỉnh sửa backend/.env với thông tin database

# 5. Khởi tạo database
cd backend && npm run init-db

# 6. Chạy ứng dụng
cd .. && npm run dev
```

### Truy cập ứng dụng
- **Frontend**: http://localhost (Docker) hoặc http://localhost:3000 (thủ công)
- **Backend API**: http://localhost:5000
- **Tài khoản**: admin / password

## 📖 Hướng dẫn chi tiết

- **👉 [SETUP.md](./SETUP.md)**: Hướng dẫn cài đặt chi tiết cho từng hệ điều hành
- **👉 [DOCKER.md](./DOCKER.md)**: Hướng dẫn Docker chi tiết
- **👉 [DEPLOY.md](./DEPLOY.md)**: Hướng dẫn đẩy lên GitHub và deploy

## 📁 Cấu trúc dự án

```
qlts/
├── backend/                 # Backend Node.js
│   ├── config/             # Cấu hình database
│   ├── database/           # Database schema
│   ├── middleware/         # Middleware functions
│   ├── routes/             # API routes
│   ├── server.js           # Server entry point
│   └── package.json
├── frontend/               # Frontend React.js
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### Assets (Tài sản)
- `GET /api/assets` - Lấy danh sách tài sản
- `GET /api/assets/:id` - Lấy thông tin tài sản
- `POST /api/assets` - Tạo tài sản mới
- `PUT /api/assets/:id` - Cập nhật tài sản
- `DELETE /api/assets/:id` - Xóa tài sản
- `GET /api/assets/:id/assignments` - Lịch sử bàn giao của tài sản

### Employees (Nhân viên)
- `GET /api/employees` - Lấy danh sách nhân viên
- `GET /api/employees/:id` - Lấy thông tin nhân viên
- `POST /api/employees` - Tạo nhân viên mới
- `PUT /api/employees/:id` - Cập nhật nhân viên
- `DELETE /api/employees/:id` - Xóa nhân viên

### Asset Types (Loại tài sản)
- `GET /api/asset-types` - Lấy danh sách loại tài sản
- `POST /api/asset-types` - Tạo loại tài sản mới
- `PUT /api/asset-types/:id` - Cập nhật loại tài sản
- `DELETE /api/asset-types/:id` - Xóa loại tài sản

### Assignments (Bàn giao)
- `GET /api/assignments` - Lấy danh sách bàn giao
- `POST /api/assignments` - Bàn giao tài sản
- `PUT /api/assignments/:id/return` - Trả tài sản
- `GET /api/assignments/employee/:employeeId` - Lịch sử bàn giao của nhân viên

## 🗄️ Database Schema

### Bảng chính
- **employees** - Thông tin nhân viên
- **asset_types** - Loại tài sản
- **assets** - Thông tin tài sản
- **asset_assignments** - Lịch sử bàn giao tài sản
- **users** - Tài khoản hệ thống

## 🚀 Deployment

### Backend (Production)
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### Frontend (Production)
```bash
cd frontend
npm run build
# Serve static files với nginx hoặc serve
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Email**: it@company.com
- **Project Link**: [https://github.com/company/qlts](https://github.com/company/qlts)

## 🙏 Acknowledgments

- [Ant Design](https://ant.design/) - UI Components
- [Express.js](https://expressjs.com/) - Web Framework
- [React.js](https://reactjs.org/) - UI Library
- [PostgreSQL](https://www.postgresql.org/) - Database
