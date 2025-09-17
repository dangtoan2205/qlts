const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách bàn giao tài sản
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT aa.*, a.asset_code, a.asset_name, at.type_name,
             e.full_name as employee_name, e.employee_id
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN employees e ON aa.employee_id = e.id
    `;
    let countQuery = `
      SELECT COUNT(*) FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN employees e ON aa.employee_id = e.id
    `;
    let params = [];
    let paramCount = 0;
    let whereConditions = [];

    if (status) {
      whereConditions.push(`aa.status = $${++paramCount}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(a.asset_name ILIKE $${++paramCount} OR a.asset_code ILIKE $${paramCount} OR e.full_name ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY aa.assigned_date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const [assignmentsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      assignments: assignmentsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bàn giao' });
  }
});

// Bàn giao tài sản cho nhân viên
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('asset_id').isInt().withMessage('ID tài sản không hợp lệ'),
  body('employee_id').isInt().withMessage('ID nhân viên không hợp lệ'),
  body('assigned_date').isISO8601().withMessage('Ngày bàn giao không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { asset_id, employee_id, assigned_date, assigned_by, notes } = req.body;

    // Kiểm tra tài sản có tồn tại và đang available không
    const assetResult = await pool.query(
      'SELECT id, status FROM assets WHERE id = $1',
      [asset_id]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    if (assetResult.rows[0].status !== 'available') {
      return res.status(400).json({ message: 'Tài sản không khả dụng để bàn giao' });
    }

    // Kiểm tra nhân viên có tồn tại không
    const employeeResult = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Kiểm tra tài sản có đang được bàn giao chưa
    const existingAssignment = await pool.query(
      'SELECT id FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [asset_id, 'active']
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ message: 'Tài sản đã được bàn giao cho nhân viên khác' });
    }

    // Bắt đầu transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Tạo bàn giao mới
      const assignmentResult = await client.query(`
        INSERT INTO asset_assignments (asset_id, employee_id, assigned_date, assigned_by, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [asset_id, employee_id, assigned_date, assigned_by, notes]);

      // Cập nhật trạng thái tài sản
      await client.query(
        'UPDATE assets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['assigned', asset_id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Bàn giao tài sản thành công',
        assignment: assignmentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Lỗi server khi bàn giao tài sản' });
  }
});

// Trả tài sản
router.put('/:id/return', [
  authenticateToken,
  requireAdmin,
  body('return_date').isISO8601().withMessage('Ngày trả không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { return_date, notes } = req.body;

    // Kiểm tra bàn giao có tồn tại và đang active không
    const assignmentResult = await pool.query(
      'SELECT * FROM asset_assignments WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn giao đang hoạt động' });
    }

    const assignment = assignmentResult.rows[0];

    // Bắt đầu transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Cập nhật bàn giao
      const updatedAssignment = await client.query(`
        UPDATE asset_assignments 
        SET return_date = $1, notes = COALESCE($2, notes), status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [return_date, notes, 'returned', id]);

      // Cập nhật trạng thái tài sản về available
      await client.query(
        'UPDATE assets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['available', assignment.asset_id]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Trả tài sản thành công',
        assignment: updatedAssignment.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Return asset error:', error);
    res.status(500).json({ message: 'Lỗi server khi trả tài sản' });
  }
});

// Lấy lịch sử bàn giao của nhân viên
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const result = await pool.query(`
      SELECT aa.*, a.asset_code, a.asset_name, at.type_name
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      JOIN asset_types at ON a.asset_type_id = at.id
      WHERE aa.employee_id = $1
      ORDER BY aa.assigned_date DESC
    `, [employeeId]);

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get employee assignments error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử bàn giao của nhân viên' });
  }
});

module.exports = router;
