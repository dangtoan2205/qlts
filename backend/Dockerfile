# Backend Dockerfile
FROM node:18-alpine

# Cài đặt các công cụ cần thiết
RUN apk add --no-cache \
    postgresql-client \
    bash

# Tạo thư mục app
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies (bao gồm cả devDependencies để đảm bảo đầy đủ)
RUN npm ci

# Copy source code
COPY . .

# Tạo thư mục cho database schema
RUN mkdir -p database

# Cấp quyền cho script chờ database
RUN chmod +x /app/wait-for-db.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application với script chờ database
ENTRYPOINT ["/app/wait-for-db.sh"]
CMD ["npm", "start"]
