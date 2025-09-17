-- Tạo database schema cho quản lý tài sản IT

-- Bảng nhân viên
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng loại tài sản
CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng tài sản
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(100) NOT NULL,
    asset_type_id INTEGER REFERENCES asset_types(id),
    brand VARCHAR(50),
    model VARCHAR(50),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'available', -- available, assigned, maintenance, retired
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lịch sử bàn giao tài sản
CREATE TABLE IF NOT EXISTS asset_assignments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    employee_id INTEGER REFERENCES employees(id),
    assigned_date DATE NOT NULL,
    return_date DATE,
    assigned_by VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, returned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng người dùng hệ thống
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- admin, user
    employee_id INTEGER REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert dữ liệu mẫu cho loại tài sản
INSERT INTO asset_types (type_name, description) VALUES
('Case PC', 'Thùng máy tính để bàn'),
('Màn hình', 'Monitor màn hình máy tính'),
('Bàn phím', 'Keyboard bàn phím máy tính'),
('Chuột', 'Mouse chuột máy tính'),
('Tai nghe', 'Headphone tai nghe'),
('Laptop', 'Máy tính xách tay'),
('MacBook', 'MacBook của Apple'),
('Thiết bị khác', 'Các thiết bị IT khác');

-- Insert admin user mặc định
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Tạo indexes để tối ưu hiệu suất
CREATE INDEX idx_assets_asset_code ON assets(asset_code);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_employee_id ON asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_status ON asset_assignments(status);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);