const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách tài sản
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', asset_type = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, at.type_name, 
             e.full_name as assigned_to_name, e.employee_id as assigned_to_id
      FROM assets a
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN asset_assignments aa ON a.id = aa.asset_id AND aa.status = 'active'
      LEFT JOIN employees e ON aa.employee_id = e.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM assets a';
    let params = [];
    let paramCount = 0;
    let whereConditions = [];

    if (search) {
      whereConditions.push(`(a.asset_name ILIKE $${++paramCount} OR a.asset_code ILIKE $${paramCount} OR a.serial_number ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push(`a.status = $${++paramCount}`);
      params.push(status);
    }

    if (asset_type) {
      whereConditions.push(`a.asset_type_id = $${++paramCount}`);
      params.push(asset_type);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const [assetsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Exclude limit and offset for count
    ]);

    res.json({
      assets: assetsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài sản' });
  }
});

// Lấy thông tin tài sản theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT a.*, at.type_name,
             e.full_name as assigned_to_name, e.employee_id as assigned_to_id,
             aa.assigned_date, aa.notes as assignment_notes
      FROM assets a
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN asset_assignments aa ON a.id = aa.asset_id AND aa.status = 'active'
      LEFT JOIN employees e ON aa.employee_id = e.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    res.json({ asset: result.rows[0] });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin tài sản' });
  }
});

// Tạo tài sản mới
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('asset_code').notEmpty().withMessage('Mã tài sản là bắt buộc'),
  body('asset_name').notEmpty().withMessage('Tên tài sản là bắt buộc'),
  body('asset_type_id').isInt().withMessage('Loại tài sản không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      asset_code, asset_name, asset_type_id, brand, model, serial_number,
      purchase_date, purchase_price, location, notes
    } = req.body;

    // Kiểm tra mã tài sản đã tồn tại chưa
    const existingAsset = await pool.query(
      'SELECT id FROM assets WHERE asset_code = $1',
      [asset_code]
    );

    if (existingAsset.rows.length > 0) {
      return res.status(400).json({ message: 'Mã tài sản đã tồn tại' });
    }

    const result = await pool.query(`
      INSERT INTO assets (asset_code, asset_name, asset_type_id, brand, model, serial_number, 
                         purchase_date, purchase_price, location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [asset_code, asset_name, asset_type_id, brand, model, serial_number, 
        purchase_date, purchase_price, location, notes]);

    res.status(201).json({
      message: 'Tạo tài sản thành công',
      asset: result.rows[0]
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo tài sản' });
  }
});

// Cập nhật tài sản
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('asset_name').notEmpty().withMessage('Tên tài sản là bắt buộc'),
  body('asset_type_id').isInt().withMessage('Loại tài sản không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      asset_name, asset_type_id, brand, model, serial_number,
      purchase_date, purchase_price, status, location, notes
    } = req.body;

    const result = await pool.query(`
      UPDATE assets 
      SET asset_name = $1, asset_type_id = $2, brand = $3, model = $4, 
          serial_number = $5, purchase_date = $6, purchase_price = $7, 
          status = $8, location = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [asset_name, asset_type_id, brand, model, serial_number, 
        purchase_date, purchase_price, status, location, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    res.json({
      message: 'Cập nhật tài sản thành công',
      asset: result.rows[0]
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật tài sản' });
  }
});

// Xóa tài sản
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra tài sản có đang được bàn giao không
    const activeAssignments = await pool.query(
      'SELECT id FROM asset_assignments WHERE asset_id = $1 AND status = $2',
      [id, 'active']
    );

    if (activeAssignments.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa tài sản đang được bàn giao' 
      });
    }

    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài sản' });
    }

    res.json({ message: 'Xóa tài sản thành công' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa tài sản' });
  }
});

// Lấy lịch sử sử dụng tài sản (người đã sử dụng, ngày bàn giao, ngày trả)
router.get('/:id/usage-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        aa.id,
        aa.assigned_date,
        aa.return_date,
        aa.assigned_by,
        aa.notes,
        aa.status,
        aa.created_at,
        e.full_name as employee_name,
        e.employee_id,
        e.department,
        e.position,
        CASE 
          WHEN aa.return_date IS NOT NULL 
          THEN (aa.return_date - aa.assigned_date)
          ELSE (CURRENT_DATE - aa.assigned_date)
        END as usage_days
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC
    `, [id]);

    res.json({ usageHistory: result.rows });
  } catch (error) {
    console.error('Get asset usage history error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử sử dụng tài sản' });
  }
});

// Lấy lịch sử bàn giao của tài sản
router.get('/:id/assignments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT aa.*, e.full_name as employee_name, e.employee_id
      FROM asset_assignments aa
      JOIN employees e ON aa.employee_id = e.id
      WHERE aa.asset_id = $1
      ORDER BY aa.assigned_date DESC
    `, [id]);

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error('Get asset assignments error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử bàn giao' });
  }
});

module.exports = router;
