const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'qlts_assets',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function initDatabase() {
  try {
    console.log('🔌 Kết nối database...');
    
    // Đọc và chạy schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Chạy database schema...');
    await pool.query(schema);
    
    console.log('✅ Database đã được khởi tạo thành công!');
    console.log('📊 Dữ liệu mẫu đã được thêm vào:');
    console.log('   - 8 loại tài sản mặc định');
    console.log('   - 1 tài khoản admin (admin/password)');
    
  } catch (error) {
    if (error.message.includes('duplicate key value')) {
      console.log('✅ Database đã có dữ liệu, bỏ qua việc thêm dữ liệu mẫu');
    } else {
      console.error('❌ Lỗi khi khởi tạo database:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

initDatabase();