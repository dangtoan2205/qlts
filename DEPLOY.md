# 🚀 Hướng dẫn đẩy dự án lên GitHub

## 📋 Chuẩn bị

### 1. Tạo repository trên GitHub
1. Truy cập: https://github.com
2. Đăng nhập vào tài khoản GitHub
3. Bấm "New repository" (nút + ở góc trên bên phải)
4. Điền thông tin:
   - **Repository name**: `qlts-asset-management`
   - **Description**: `Phần mềm quản lý tài sản IT cho công ty`
   - **Visibility**: Public hoặc Private (tùy chọn)
   - **Initialize**: Không tích vào "Add a README file" (vì đã có sẵn)
5. Bấm "Create repository"

### 2. Cài đặt Git (nếu chưa có)
- **Windows**: Tải từ https://git-scm.com/download/win
- **macOS**: `brew install git` hoặc tải từ git-scm.com
- **Linux**: `sudo apt install git` (Ubuntu/Debian)

## 🔧 Cấu hình Git

### 1. Cấu hình thông tin cá nhân:
```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

### 2. Kiểm tra cấu hình:
```bash
git config --list
```

## 📤 Đẩy dự án lên GitHub

### 1. Khởi tạo Git repository:
```bash
# Từ thư mục dự án (qlts)
git init
```

### 2. Thêm tất cả files:
```bash
git add .
```

### 3. Commit lần đầu:
```bash
git commit -m "Initial commit: QLTS Asset Management System

- Backend: Node.js + Express + PostgreSQL
- Frontend: React.js + Ant Design
- Features: Asset management, Employee management, Assignment tracking
- Database: PostgreSQL with Docker support
- Authentication: JWT-based security"
```

### 4. Thêm remote repository:
```bash
# Thay <username> bằng tên GitHub của bạn
git remote add origin https://github.com/<username>/qlts-asset-management.git
```

### 5. Đẩy lên GitHub:
```bash
git branch -M main
git push -u origin main
```

## 🔄 Cập nhật dự án sau này

### Khi có thay đổi mới:
```bash
# 1. Xem thay đổi
git status

# 2. Thêm files đã thay đổi
git add .

# 3. Commit với message mô tả
git commit -m "Add new feature: Asset usage history tracking"

# 4. Đẩy lên GitHub
git push origin main
```

### Xem lịch sử commit:
```bash
git log --oneline
```

## 📥 Clone dự án về máy khác

### 1. Clone repository:
```bash
git clone https://github.com/<username>/qlts-asset-management.git
cd qlts-asset-management
```

### 2. Cài đặt và chạy:
```bash
# Làm theo hướng dẫn trong SETUP.md
npm run install-all
docker-compose up -d
cp backend/env.example backend/.env
cd backend && npm run init-db
cd .. && npm run dev
```

## 🏷️ Tạo Release

### 1. Tạo tag cho version:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 2. Tạo Release trên GitHub:
1. Vào repository trên GitHub
2. Bấm "Releases" → "Create a new release"
3. Chọn tag v1.0.0
4. Điền thông tin release
5. Bấm "Publish release"

## 🔧 Cấu hình CI/CD (Tùy chọn)

### Tạo file `.github/workflows/deploy.yml`:
```yaml
name: Deploy QLTS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: |
        npm run install-all
        
    - name: Build frontend
      run: |
        cd frontend
        npm run build
        
    - name: Deploy
      run: |
        echo "Deploy to production server"
```

## 📝 Cấu trúc repository

```
qlts-asset-management/
├── .github/                 # GitHub workflows
├── backend/                 # Backend Node.js
├── frontend/                # Frontend React.js
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker configuration
├── package.json            # Root package.json
├── README.md               # Hướng dẫn chính
├── SETUP.md                # Hướng dẫn cài đặt
└── DEPLOY.md               # Hướng dẫn deploy (file này)
```

## 🚨 Lưu ý quan trọng

### 1. Không commit file `.env`:
- File `.env` chứa thông tin nhạy cảm
- Đã được thêm vào `.gitignore`
- Luôn tạo file `.env` từ `.env.example` trên máy mới

### 2. Database:
- Không commit database files
- Sử dụng Docker hoặc cài đặt PostgreSQL riêng
- Schema được lưu trong `backend/database/schema.sql`

### 3. Dependencies:
- Luôn commit `package.json` và `package-lock.json`
- Không commit `node_modules/`
- Chạy `npm install` sau khi clone

## 🆘 Khắc phục sự cố

### Lỗi "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/<username>/qlts-asset-management.git
```

### Lỗi "failed to push some refs":
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Lỗi authentication:
```bash
# Sử dụng Personal Access Token thay vì password
# Tạo token tại: GitHub → Settings → Developer settings → Personal access tokens
```

## 📞 Hỗ trợ

Nếu gặp vấn đề khi đẩy code lên GitHub:

1. **Kiểm tra kết nối internet**
2. **Kiểm tra thông tin Git config**
3. **Kiểm tra quyền truy cập repository**
4. **Xem logs lỗi chi tiết**

Chúc bạn đẩy dự án thành công! 🚀
