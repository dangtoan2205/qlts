const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin, requireDeletePermission, requireEditPermission, requireDeletePermissionByEntity } = require('../middleware/auth');
const { logActivity, generateDescription } = require('../utils/activityLogger');

const router = express.Router();

// Lấy danh sách nhân viên
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, employee_id, full_name, email, department, position, phone, created_at
      FROM employees
    `;
    let countQuery = 'SELECT COUNT(*) FROM employees';
    let params = [];
    let paramCount = 0;

    if (search) {
      query += ` WHERE full_name ILIKE $${++paramCount} OR employee_id ILIKE $${paramCount} OR email ILIKE $${paramCount}`;
      countQuery += ` WHERE full_name ILIKE $1 OR employee_id ILIKE $1 OR email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const [employeesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    res.json({
      employees: employeesResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân viên' });
  }
});

// Lấy thông tin nhân viên theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    res.json({ employee: result.rows[0] });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin nhân viên' });
  }
});

// Tạo nhân viên mới
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('employee_id').notEmpty().withMessage('Mã nhân viên là bắt buộc'),
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, full_name, email, department, position, phone } = req.body;

    // Kiểm tra employee_id và email đã tồn tại chưa
    const existingEmployee = await pool.query(
      'SELECT id FROM employees WHERE employee_id = $1 OR email = $2',
      [employee_id, email]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(400).json({ message: 'Mã nhân viên hoặc email đã tồn tại' });
    }

    const result = await pool.query(
      `INSERT INTO employees (employee_id, full_name, email, department, position, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [employee_id, full_name, email, department, position, phone]
    );

    const newEmployee = result.rows[0];

    // Ghi log hoạt động
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'create',
      entityType: 'employee',
      entityId: newEmployee.id,
      entityName: `${newEmployee.employee_id} - ${newEmployee.full_name}`,
      newValues: newEmployee,
      description: generateDescription('create', 'employee', `${newEmployee.employee_id} - ${newEmployee.full_name}`),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      message: 'Tạo nhân viên thành công',
      employee: newEmployee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo nhân viên' });
  }
});

// Cập nhật nhân viên
router.put('/:id', [
  authenticateToken,
  requireEditPermission('employee'),
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { full_name, email, department, position, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa (trừ nhân viên hiện tại)
    const existingEmployee = await pool.query(
      'SELECT id FROM employees WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Lấy giá trị cũ trước khi cập nhật
    const oldEmployeeResult = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (oldEmployeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    const oldEmployee = oldEmployeeResult.rows[0];

    const result = await pool.query(
      `UPDATE employees 
       SET full_name = $1, email = $2, department = $3, position = $4, phone = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [full_name, email, department, position, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    const updatedEmployee = result.rows[0];

    // Ghi log hoạt động
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'update',
      entityType: 'employee',
      entityId: updatedEmployee.id,
      entityName: `${updatedEmployee.employee_id} - ${updatedEmployee.full_name}`,
      oldValues: oldEmployee,
      newValues: updatedEmployee,
      description: generateDescription('update', 'employee', `${updatedEmployee.employee_id} - ${updatedEmployee.full_name}`),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      message: 'Cập nhật nhân viên thành công',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân viên' });
  }
});

// Xóa nhân viên
router.delete('/:id', [authenticateToken, requireDeletePermissionByEntity('employee')], async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin nhân viên trước khi xóa để ghi log
    const employeeResult = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }
    const employee = employeeResult.rows[0];

    // Kiểm tra nhân viên có đang sử dụng tài sản không
    const activeAssignments = await pool.query(
      'SELECT id FROM asset_assignments WHERE employee_id = $1 AND status = $2',
      [id, 'active']
    );

    if (activeAssignments.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa nhân viên đang có tài sản được bàn giao' 
      });
    }

    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Ghi log hoạt động
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'delete',
      entityType: 'employee',
      entityId: employee.id,
      entityName: `${employee.employee_id} - ${employee.full_name}`,
      oldValues: employee,
      description: generateDescription('delete', 'employee', `${employee.employee_id} - ${employee.full_name}`),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa nhân viên' });
  }
});

// Lấy tài sản đang sử dụng của nhân viên
router.get('/:id/assets', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT a.*, at.type_name, aa.assigned_date, aa.notes as assignment_notes
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN asset_assignments aa ON a.id = aa.asset_id
      WHERE aa.employee_id = $1 AND aa.status = 'active'
      ORDER BY aa.assigned_date DESC
    `, [id]);

    res.json({ assets: result.rows });
  } catch (error) {
    console.error('Get employee assets error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tài sản của nhân viên' });
  }
});

// Lấy lịch sử bàn giao của nhân viên
router.get('/:id/assignments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT aa.*, a.asset_code, a.asset_name, at.type_name
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN asset_types at ON a.asset_type_id = at.id
      WHERE aa.employee_id = $1
      ORDER BY aa.assigned_date DESC
    `, [id]);

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get employee assignments error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử bàn giao của nhân viên' });
  }
});

module.exports = router;
