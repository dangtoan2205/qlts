const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();

// Cấu hình multer để lưu file tạm
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'), false);
    }
  }
});

// Hàm parse ngày tháng
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'number') {
    // Excel date serial number
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 86400000);
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Hàm parse số
const parseNumber = (value) => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Import tài sản
router.post('/assets', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file Excel để import' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet('Tài sản') || workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: 'Không tìm thấy sheet "Tài sản" trong file Excel' });
    }

    const rows = [];
    let headerRow = null;
    let headerIndex = -1;

    // Tìm header row
    worksheet.eachRow((row, rowNumber) => {
      const firstCell = row.getCell(1).value;
      if (firstCell && firstCell.toString().trim() === 'Mã tài sản') {
        headerRow = row;
        headerIndex = rowNumber;
        return false; // Dừng loop
      }
    });

    if (!headerRow) {
      return res.status(400).json({ message: 'Không tìm thấy header row trong file Excel' });
    }

    // Tạo map header
    const headerMap = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerValue = cell.value?.toString().trim();
      if (headerValue) {
        headerMap[headerValue] = colNumber;
      }
    });

    // Đọc dữ liệu
    const errors = [];
    const success = [];
    let rowIndex = headerIndex + 1;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerIndex) return;

      const rowData = {};
      let hasData = false;

      // Đọc các cột
      if (headerMap['Mã tài sản']) {
        const cell = row.getCell(headerMap['Mã tài sản']);
        rowData.asset_code = cell.value?.toString().trim();
        if (rowData.asset_code) hasData = true;
      }
      if (headerMap['Tên tài sản']) {
        const cell = row.getCell(headerMap['Tên tài sản']);
        rowData.asset_name = cell.value?.toString().trim();
      }
      if (headerMap['Loại tài sản']) {
        const cell = row.getCell(headerMap['Loại tài sản']);
        rowData.type_name = cell.value?.toString().trim();
      }
      if (headerMap['Thương hiệu']) {
        const cell = row.getCell(headerMap['Thương hiệu']);
        rowData.brand = cell.value?.toString().trim() || null;
      }
      if (headerMap['Model']) {
        const cell = row.getCell(headerMap['Model']);
        rowData.model = cell.value?.toString().trim() || null;
      }
      if (headerMap['Số Serial']) {
        const cell = row.getCell(headerMap['Số Serial']);
        rowData.serial_number = cell.value?.toString().trim() || null;
      }
      if (headerMap['Ngày mua']) {
        const cell = row.getCell(headerMap['Ngày mua']);
        rowData.purchase_date = parseDate(cell.value);
      }
      if (headerMap['Giá mua']) {
        const cell = row.getCell(headerMap['Giá mua']);
        rowData.purchase_price = parseNumber(cell.value);
      }
      if (headerMap['Vị trí']) {
        const cell = row.getCell(headerMap['Vị trí']);
        rowData.location = cell.value?.toString().trim() || null;
      }
      if (headerMap['Ghi chú']) {
        const cell = row.getCell(headerMap['Ghi chú']);
        rowData.notes = cell.value?.toString().trim() || null;
      }
      if (headerMap['Trạng thái']) {
        const cell = row.getCell(headerMap['Trạng thái']);
        const statusText = cell.value?.toString().trim();
        if (statusText) {
          const statusMap = {
            'Khả dụng': 'available',
            'Đã bàn giao': 'assigned',
            'Bảo trì': 'maintenance',
            'Ngừng sử dụng': 'retired'
          };
          rowData.status = statusMap[statusText] || 'available';
        }
      }

      if (!hasData) return; // Bỏ qua dòng trống

      // Validate
      if (!rowData.asset_code) {
        errors.push({ row: rowNumber, message: 'Thiếu mã tài sản' });
        return;
      }
      if (!rowData.asset_name) {
        errors.push({ row: rowNumber, message: 'Thiếu tên tài sản' });
        return;
      }

      rows.push({ rowNumber, data: rowData });
    });

    // Import vào database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const { rowNumber, data } of rows) {
        try {
          // Tìm asset_type_id
          let asset_type_id = null;
          if (data.type_name) {
            const typeResult = await client.query(
              'SELECT id FROM asset_types WHERE type_name = $1',
              [data.type_name]
            );
            if (typeResult.rows.length > 0) {
              asset_type_id = typeResult.rows[0].id;
            } else {
              // Tạo loại tài sản mới nếu chưa có
              const newTypeResult = await client.query(
                'INSERT INTO asset_types (type_name) VALUES ($1) RETURNING id',
                [data.type_name]
              );
              asset_type_id = newTypeResult.rows[0].id;
            }
          }

          // Kiểm tra mã tài sản đã tồn tại chưa
          const existingAsset = await client.query(
            'SELECT id FROM assets WHERE asset_code = $1',
            [data.asset_code]
          );

          if (existingAsset.rows.length > 0) {
            // Update nếu đã tồn tại
            await client.query(
              `UPDATE assets SET
                asset_name = $1,
                asset_type_id = $2,
                brand = $3,
                model = $4,
                serial_number = $5,
                purchase_date = $6,
                purchase_price = $7,
                location = $8,
                notes = $9,
                status = COALESCE($10, status),
                updated_at = CURRENT_TIMESTAMP
               WHERE asset_code = $11`,
              [
                data.asset_name,
                asset_type_id,
                data.brand,
                data.model,
                data.serial_number,
                data.purchase_date ? data.purchase_date.toISOString().split('T')[0] : null,
                data.purchase_price,
                data.location,
                data.notes,
                data.status,
                data.asset_code
              ]
            );
            success.push({ row: rowNumber, asset_code: data.asset_code, action: 'updated' });
          } else {
            // Insert mới
            await client.query(
              `INSERT INTO assets 
               (asset_code, asset_name, asset_type_id, brand, model, serial_number, 
                purchase_date, purchase_price, location, notes, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                data.asset_code,
                data.asset_name,
                asset_type_id,
                data.brand,
                data.model,
                data.serial_number,
                data.purchase_date ? data.purchase_date.toISOString().split('T')[0] : null,
                data.purchase_price,
                data.location,
                data.notes,
                data.status || 'available'
              ]
            );
            success.push({ row: rowNumber, asset_code: data.asset_code, action: 'created' });
          }
        } catch (error) {
          errors.push({ row: rowNumber, message: error.message });
        }
      }

      await client.query('COMMIT');

      // Ghi log
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        actionType: 'import',
        entityType: 'asset',
        entityName: `Import ${success.length} tài sản từ file Excel`,
        description: `Import ${success.length} tài sản thành công, ${errors.length} lỗi`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      res.json({
        message: 'Import dữ liệu hoàn tất',
        success: success.length,
        errors: errors.length,
        details: {
          success: success,
          errors: errors
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi import dữ liệu' });
  }
});

// Import nhân viên
router.post('/employees', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file Excel để import' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet('Nhân viên') || workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: 'Không tìm thấy sheet "Nhân viên" trong file Excel' });
    }

    const rows = [];
    let headerRow = null;
    let headerIndex = -1;

    // Tìm header row
    worksheet.eachRow((row, rowNumber) => {
      const firstCell = row.getCell(1).value;
      if (firstCell && firstCell.toString().trim() === 'Mã nhân viên') {
        headerRow = row;
        headerIndex = rowNumber;
        return false;
      }
    });

    if (!headerRow) {
      return res.status(400).json({ message: 'Không tìm thấy header row trong file Excel' });
    }

    // Tạo map header
    const headerMap = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerValue = cell.value?.toString().trim();
      if (headerValue) {
        headerMap[headerValue] = colNumber;
      }
    });

    // Đọc dữ liệu
    const errors = [];
    const success = [];
    let rowIndex = headerIndex + 1;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerIndex) return;

      const rowData = {};
      let hasData = false;

      if (headerMap['Mã nhân viên']) {
        const cell = row.getCell(headerMap['Mã nhân viên']);
        rowData.employee_id = cell.value?.toString().trim();
        if (rowData.employee_id) hasData = true;
      }
      if (headerMap['Họ và tên']) {
        const cell = row.getCell(headerMap['Họ và tên']);
        rowData.full_name = cell.value?.toString().trim();
      }
      if (headerMap['Email']) {
        const cell = row.getCell(headerMap['Email']);
        rowData.email = cell.value?.toString().trim();
      }
      if (headerMap['Phòng ban']) {
        const cell = row.getCell(headerMap['Phòng ban']);
        rowData.department = cell.value?.toString().trim() || null;
      }
      if (headerMap['Chức vụ']) {
        const cell = row.getCell(headerMap['Chức vụ']);
        rowData.position = cell.value?.toString().trim() || null;
      }
      if (headerMap['Số điện thoại']) {
        const cell = row.getCell(headerMap['Số điện thoại']);
        rowData.phone = cell.value?.toString().trim() || null;
      }

      if (!hasData) return;

      // Validate
      if (!rowData.employee_id) {
        errors.push({ row: rowNumber, message: 'Thiếu mã nhân viên' });
        return;
      }
      if (!rowData.full_name) {
        errors.push({ row: rowNumber, message: 'Thiếu họ và tên' });
        return;
      }
      if (!rowData.email) {
        errors.push({ row: rowNumber, message: 'Thiếu email' });
        return;
      }

      rows.push({ rowNumber, data: rowData });
    });

    // Import vào database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const { rowNumber, data } of rows) {
        try {
          // Kiểm tra mã nhân viên hoặc email đã tồn tại chưa
          const existingEmployee = await client.query(
            'SELECT id FROM employees WHERE employee_id = $1 OR email = $2',
            [data.employee_id, data.email]
          );

          if (existingEmployee.rows.length > 0) {
            // Update nếu đã tồn tại
            await client.query(
              `UPDATE employees SET
                full_name = $1,
                email = $2,
                department = $3,
                position = $4,
                phone = $5,
                updated_at = CURRENT_TIMESTAMP
               WHERE employee_id = $6 OR email = $7`,
              [
                data.full_name,
                data.email,
                data.department,
                data.position,
                data.phone,
                data.employee_id,
                data.email
              ]
            );
            success.push({ row: rowNumber, employee_id: data.employee_id, action: 'updated' });
          } else {
            // Insert mới
            await client.query(
              `INSERT INTO employees (employee_id, full_name, email, department, position, phone)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                data.employee_id,
                data.full_name,
                data.email,
                data.department,
                data.position,
                data.phone
              ]
            );
            success.push({ row: rowNumber, employee_id: data.employee_id, action: 'created' });
          }
        } catch (error) {
          errors.push({ row: rowNumber, message: error.message });
        }
      }

      await client.query('COMMIT');

      // Ghi log
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        actionType: 'import',
        entityType: 'employee',
        entityName: `Import ${success.length} nhân viên từ file Excel`,
        description: `Import ${success.length} nhân viên thành công, ${errors.length} lỗi`,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      res.json({
        message: 'Import dữ liệu hoàn tất',
        success: success.length,
        errors: errors.length,
        details: {
          success: success,
          errors: errors
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi import dữ liệu' });
  }
});

module.exports = router;

