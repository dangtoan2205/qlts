const express = require('express');
const ExcelJS = require('exceljs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Format ngày tháng cho tên file
const formatDateForFileName = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Export dữ liệu toàn bộ
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const dateStr = formatDateForFileName(new Date());

    // Sheet 1: Tài sản
    const assetsSheet = workbook.addWorksheet('Tài sản');
    assetsSheet.columns = [
      { header: 'Mã tài sản', key: 'asset_code', width: 20 },
      { header: 'Tên tài sản', key: 'asset_name', width: 30 },
      { header: 'Loại tài sản', key: 'type_name', width: 20 },
      { header: 'Thương hiệu', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Số Serial', key: 'serial_number', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ngày mua', key: 'purchase_date', width: 15 },
      { header: 'Giá mua', key: 'purchase_price', width: 15 },
      { header: 'Vị trí', key: 'location', width: 20 },
      { header: 'Ghi chú', key: 'notes', width: 30 },
      { header: 'Người sử dụng', key: 'assigned_to_name', width: 25 },
      { header: 'Ngày tạo', key: 'created_at', width: 20 }
    ];

    const assetsQuery = `
      SELECT 
        a.asset_code,
        a.asset_name,
        at.type_name,
        a.brand,
        a.model,
        a.serial_number,
        CASE 
          WHEN a.status = 'available' THEN 'Khả dụng'
          WHEN a.status = 'assigned' THEN 'Đã bàn giao'
          WHEN a.status = 'maintenance' THEN 'Bảo trì'
          WHEN a.status = 'retired' THEN 'Ngừng sử dụng'
          ELSE a.status
        END as status,
        a.purchase_date,
        a.purchase_price,
        a.location,
        a.notes,
        e.full_name as assigned_to_name,
        a.created_at
      FROM assets a
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN asset_assignments aa ON a.id = aa.asset_id AND aa.status = 'active'
      LEFT JOIN employees e ON aa.employee_id = e.id
      ORDER BY a.created_at DESC
    `;

    const assetsResult = await pool.query(assetsQuery);
    assetsResult.rows.forEach(row => {
      assetsSheet.addRow({
        asset_code: row.asset_code,
        asset_name: row.asset_name,
        type_name: row.type_name || '',
        brand: row.brand || '',
        model: row.model || '',
        serial_number: row.serial_number || '',
        status: row.status,
        purchase_date: row.purchase_date ? new Date(row.purchase_date).toLocaleDateString('vi-VN') : '',
        purchase_price: row.purchase_price ? new Intl.NumberFormat('vi-VN').format(row.purchase_price) : '',
        location: row.location || '',
        notes: row.notes || '',
        assigned_to_name: row.assigned_to_name || '',
        created_at: new Date(row.created_at).toLocaleString('vi-VN')
      });
    });

    // Style header
    assetsSheet.getRow(1).font = { bold: true };
    assetsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Sheet 2: Nhân viên
    const employeesSheet = workbook.addWorksheet('Nhân viên');
    employeesSheet.columns = [
      { header: 'Mã nhân viên', key: 'employee_id', width: 15 },
      { header: 'Họ và tên', key: 'full_name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phòng ban', key: 'department', width: 20 },
      { header: 'Chức vụ', key: 'position', width: 20 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Ngày tạo', key: 'created_at', width: 20 }
    ];

    const employeesQuery = `
      SELECT employee_id, full_name, email, department, position, phone, created_at
      FROM employees
      ORDER BY created_at DESC
    `;

    const employeesResult = await pool.query(employeesQuery);
    employeesResult.rows.forEach(row => {
      employeesSheet.addRow({
        employee_id: row.employee_id,
        full_name: row.full_name,
        email: row.email,
        department: row.department || '',
        position: row.position || '',
        phone: row.phone || '',
        created_at: new Date(row.created_at).toLocaleString('vi-VN')
      });
    });

    employeesSheet.getRow(1).font = { bold: true };
    employeesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Sheet 3: Bàn giao tài sản
    const assignmentsSheet = workbook.addWorksheet('Bàn giao tài sản');
    assignmentsSheet.columns = [
      { header: 'Mã tài sản', key: 'asset_code', width: 20 },
      { header: 'Tên tài sản', key: 'asset_name', width: 30 },
      { header: 'Mã nhân viên', key: 'employee_id', width: 15 },
      { header: 'Tên nhân viên', key: 'employee_name', width: 30 },
      { header: 'Ngày bàn giao', key: 'assigned_date', width: 15 },
      { header: 'Ngày trả', key: 'return_date', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Người bàn giao', key: 'assigned_by', width: 20 },
      { header: 'Ghi chú', key: 'notes', width: 30 },
      { header: 'Ngày tạo', key: 'created_at', width: 20 }
    ];

    const assignmentsQuery = `
      SELECT 
        a.asset_code,
        a.asset_name,
        e.employee_id,
        e.full_name as employee_name,
        aa.assigned_date,
        aa.return_date,
        CASE 
          WHEN aa.status = 'active' THEN 'Đang sử dụng'
          WHEN aa.status = 'returned' THEN 'Đã trả'
          ELSE aa.status
        END as status,
        aa.assigned_by,
        aa.notes,
        aa.created_at
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN employees e ON aa.employee_id = e.id
      ORDER BY aa.created_at DESC
    `;

    const assignmentsResult = await pool.query(assignmentsQuery);
    assignmentsResult.rows.forEach(row => {
      assignmentsSheet.addRow({
        asset_code: row.asset_code,
        asset_name: row.asset_name,
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        assigned_date: row.assigned_date ? new Date(row.assigned_date).toLocaleDateString('vi-VN') : '',
        return_date: row.return_date ? new Date(row.return_date).toLocaleDateString('vi-VN') : '',
        status: row.status,
        assigned_by: row.assigned_by || '',
        notes: row.notes || '',
        created_at: new Date(row.created_at).toLocaleString('vi-VN')
      });
    });

    assignmentsSheet.getRow(1).font = { bold: true };
    assignmentsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="export-all-data-${dateStr}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export all data error:', error);
    res.status(500).json({ message: 'Lỗi khi xuất dữ liệu' });
  }
});

// Export dữ liệu theo user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const workbook = new ExcelJS.Workbook();
    const dateStr = formatDateForFileName(new Date());

    // Sheet 1: Tài sản được bàn giao cho user này
    const assetsSheet = workbook.addWorksheet('Tài sản đã bàn giao');
    assetsSheet.columns = [
      { header: 'Người sử dụng', key: 'employee_name', width: 25 },
      { header: 'Mã tài sản', key: 'asset_code', width: 20 },
      { header: 'Tên tài sản', key: 'asset_name', width: 30 },
      { header: 'Loại tài sản', key: 'type_name', width: 20 },
      { header: 'Thương hiệu', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Số Serial', key: 'serial_number', width: 20 },
      { header: 'Ngày bàn giao', key: 'assigned_date', width: 15 },
      { header: 'Ngày trả', key: 'return_date', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ghi chú', key: 'notes', width: 30 }
    ];

    // Lấy employee_id và username từ user (users.employee_id là INTEGER REFERENCES employees(id))
    const employeeQuery = 'SELECT employee_id, username FROM users WHERE id = $1';
    const employeeResult = await pool.query(employeeQuery, [userId]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const username = employeeResult.rows[0].username;
    const empId = employeeResult.rows[0].employee_id;

    // Tìm tài sản được bàn giao cho user này
    // Cách 1: Nếu user có employee_id, lấy từ asset_assignments (tài sản được bàn giao cho employee này)
    // Cách 2: Nếu không, lấy từ activity_logs (các assignment mà user này đã tạo)
    let assetsQuery;
    let assetsParams;

    if (empId) {
      // User có employee_id - lấy tài sản được bàn giao cho employee này
      assetsQuery = `
        SELECT 
          a.asset_code,
          a.asset_name,
          at.type_name,
          a.brand,
          a.model,
          a.serial_number,
          aa.assigned_date,
          aa.return_date,
          CASE 
            WHEN aa.status = 'active' THEN 'Đang sử dụng'
            WHEN aa.status = 'returned' THEN 'Đã trả'
            ELSE aa.status
          END as status,
          e.full_name as employee_name,
          aa.notes
        FROM asset_assignments aa
        JOIN assets a ON aa.asset_id = a.id
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN employees e ON aa.employee_id = e.id
        WHERE aa.employee_id = $1
        ORDER BY e.full_name ASC, aa.assigned_date DESC
      `;
      assetsParams = [empId];
    } else {
      // User không có employee_id - lấy các assignment mà user này đã tạo (qua activity_logs)
      // Tìm các assignment_id từ activity_logs với user_id và action_type = 'assign'
      assetsQuery = `
        SELECT DISTINCT
          a.asset_code,
          a.asset_name,
          at.type_name,
          a.brand,
          a.model,
          a.serial_number,
          aa.assigned_date,
          aa.return_date,
          CASE 
            WHEN aa.status = 'active' THEN 'Đang sử dụng'
            WHEN aa.status = 'returned' THEN 'Đã trả'
            ELSE aa.status
          END as status,
          e.full_name as employee_name,
          aa.notes
        FROM asset_assignments aa
        JOIN assets a ON aa.asset_id = a.id
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN employees e ON aa.employee_id = e.id
        WHERE aa.id IN (
          SELECT entity_id 
          FROM activity_logs 
          WHERE user_id = $1 
            AND action_type = 'assign' 
            AND entity_type = 'assignment'
        )
        ORDER BY e.full_name ASC, aa.assigned_date DESC
      `;
      assetsParams = [userId];
    }

    const assetsResult = await pool.query(assetsQuery, assetsParams);
    
    if (assetsResult.rows.length > 0) {
      assetsResult.rows.forEach(row => {
        assetsSheet.addRow({
          employee_name: row.employee_name || '',
          asset_code: row.asset_code,
          asset_name: row.asset_name,
          type_name: row.type_name || '',
          brand: row.brand || '',
          model: row.model || '',
          serial_number: row.serial_number || '',
          assigned_date: row.assigned_date ? new Date(row.assigned_date).toLocaleDateString('vi-VN') : '',
          return_date: row.return_date ? new Date(row.return_date).toLocaleDateString('vi-VN') : '',
          status: row.status,
          notes: row.notes || ''
        });
      });
    } else {
      // Nếu không có dữ liệu
      assetsSheet.addRow({
        employee_name: '',
        asset_code: 'Không có dữ liệu',
        asset_name: empId ? 'Chưa có tài sản nào được bàn giao cho nhân viên này' : 'Chưa có tài sản nào được bàn giao bởi user này',
        type_name: '',
        brand: '',
        model: '',
        serial_number: '',
        assigned_date: '',
        return_date: '',
        status: '',
        notes: ''
      });
    }

    assetsSheet.getRow(1).font = { bold: true };
    assetsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Sheet 2: Lịch sử hoạt động của user
    const activitySheet = workbook.addWorksheet('Lịch sử hoạt động');
    activitySheet.columns = [
      { header: 'Thời gian', key: 'created_at', width: 20 },
      { header: 'Hành động', key: 'action_type', width: 15 },
      { header: 'Loại đối tượng', key: 'entity_type', width: 15 },
      { header: 'Tên đối tượng', key: 'entity_name', width: 30 },
      { header: 'Mô tả', key: 'description', width: 40 }
    ];

    const activityQuery = `
      SELECT 
        created_at,
        CASE 
          WHEN action_type = 'create' THEN 'Tạo mới'
          WHEN action_type = 'update' THEN 'Cập nhật'
          WHEN action_type = 'delete' THEN 'Xóa'
          WHEN action_type = 'assign' THEN 'Bàn giao'
          WHEN action_type = 'return' THEN 'Trả lại'
          ELSE action_type
        END as action_type,
        CASE 
          WHEN entity_type = 'asset' THEN 'Tài sản'
          WHEN entity_type = 'employee' THEN 'Nhân viên'
          WHEN entity_type = 'assignment' THEN 'Bàn giao'
          ELSE entity_type
        END as entity_type,
        entity_name,
        description
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const activityResult = await pool.query(activityQuery, [userId]);
    activityResult.rows.forEach(row => {
      activitySheet.addRow({
        created_at: new Date(row.created_at).toLocaleString('vi-VN'),
        action_type: row.action_type,
        entity_type: row.entity_type,
        entity_name: row.entity_name || '',
        description: row.description || ''
      });
    });

    activitySheet.getRow(1).font = { bold: true };
    activitySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="export-data-user-${dateStr}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ message: 'Lỗi khi xuất dữ liệu' });
  }
});

module.exports = router;

