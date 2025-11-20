# Frontend Dockerfile
FROM node:18-alpine as build

# Tạo thư mục app
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Production stage với Nginx
FROM nginx:alpine

# Copy built files từ build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
