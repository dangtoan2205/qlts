# 🐳 Hướng dẫn chạy ứng dụng với Docker

## 📋 Yêu cầu

- **Docker**: >= 20.0.0
- **Docker Compose**: >= 2.0.0

## 🚀 Chạy ứng dụng với Docker

### Cách 1: Chạy tất cả services (Khuyến nghị)

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

### Cách 2: Chạy từng service riêng lẻ

```bash
# 1. Chạy database
docker-compose up -d postgres

# 2. Chạy backend
docker-compose up -d backend

# 3. Chạy frontend
docker-compose up -d frontend
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Tài khoản mặc định:
- **Username**: `admin`
- **Password**: `password`

## 🔧 Quản lý Docker

### Xem trạng thái containers:
```bash
docker-compose ps
```

### Xem logs:
```bash
# Tất cả services
docker-compose logs -f

# Service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart services:
```bash
# Restart tất cả
docker-compose restart

# Restart service cụ thể
docker-compose restart backend
```

### Dừng và xóa:
```bash
# Dừng services
docker-compose down

# Dừng và xóa volumes (mất dữ liệu)
docker-compose down -v

# Dừng và xóa images
docker-compose down --rmi all
```

## 🛠️ Development với Docker

### Chạy trong development mode:
```bash
# Chỉ chạy database
docker-compose up -d postgres

# Chạy backend và frontend locally
npm run dev
```

### Rebuild images:
```bash
# Rebuild tất cả
docker-compose build

# Rebuild service cụ thể
docker-compose build backend
docker-compose build frontend
```

### Chạy với rebuild:
```bash
docker-compose up --build
```

## 🔍 Debug và Troubleshooting

### Kiểm tra logs lỗi:
```bash
# Xem logs chi tiết
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
```

### Vào trong container:
```bash
# Vào backend container
docker-compose exec backend sh

# Vào database container
docker-compose exec postgres psql -U postgres -d qlts_assets
```

### Kiểm tra kết nối database:
```bash
# Từ backend container
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'qlts_assets',
  user: 'postgres',
  password: 'password'
});
pool.query('SELECT NOW()').then(res => console.log(res.rows[0])).catch(console.error);
"
```

### Reset database:
```bash
# Dừng services
docker-compose down

# Xóa volume database
docker volume rm qlts_postgres_data

# Chạy lại
docker-compose up -d
```

## 📊 Monitoring

### Xem resource usage:
```bash
docker stats
```

### Health checks:
```bash
# Kiểm tra health status
docker-compose ps

# Xem health check logs
docker inspect qlts_backend | grep -A 10 Health
```

## 🚀 Production Deployment

### Cấu hình production:
```bash
# Tạo file .env.production
cat > .env.production << EOF
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=qlts_assets
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
PORT=5000
EOF

# Chạy với production config
docker-compose --env-file .env.production up -d
```

### Sử dụng Docker Swarm:
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml qlts
```

## 🔧 Cấu hình nâng cao

### Thay đổi ports:
```yaml
# Trong docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"  # Thay đổi port frontend
  backend:
    ports:
      - "3001:5000"  # Thay đổi port backend
```

### Thêm environment variables:
```yaml
# Trong docker-compose.yml
services:
  backend:
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - CUSTOM_VAR=value
```

### Sử dụng external network:
```yaml
# Trong docker-compose.yml
services:
  postgres:
    networks:
      - external_network
  backend:
    networks:
      - external_network
  frontend:
    networks:
      - external_network

networks:
  external_network:
    external: true
```

## 📁 Cấu trúc Docker

```
qlts/
├── docker-compose.yml          # Docker Compose config
├── backend/
│   ├── Dockerfile              # Backend Docker image
│   └── .dockerignore           # Backend ignore files
├── frontend/
│   ├── Dockerfile              # Frontend Docker image
│   ├── nginx.conf              # Nginx config
│   └── .dockerignore           # Frontend ignore files
└── DOCKER.md                   # Hướng dẫn Docker (file này)
```

## 🆘 Khắc phục sự cố

### Container không start:
```bash
# Xem logs lỗi
docker-compose logs service_name

# Kiểm tra image
docker images | grep qlts

# Rebuild image
docker-compose build --no-cache service_name
```

### Database connection failed:
```bash
# Kiểm tra database container
docker-compose ps postgres

# Kiểm tra logs database
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Frontend không load:
```bash
# Kiểm tra nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Kiểm tra files
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Port conflicts:
```bash
# Kiểm tra ports đang sử dụng
netstat -tulpn | grep :80
netstat -tulpn | grep :5000

# Thay đổi ports trong docker-compose.yml
```

## 🎯 Lợi ích của Docker

✅ **Dễ dàng deploy**: Chạy trên bất kỳ máy nào có Docker  
✅ **Môi trường nhất quán**: Development và production giống nhau  
✅ **Isolation**: Mỗi service chạy trong container riêng  
✅ **Scalability**: Dễ dàng scale services  
✅ **Backup**: Dữ liệu được lưu trong volumes  
✅ **Health checks**: Tự động kiểm tra sức khỏe services  

Chúc bạn sử dụng Docker thành công! 🚀

