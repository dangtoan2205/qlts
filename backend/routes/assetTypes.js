const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách loại tài sản
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM asset_types ORDER BY type_name'
    );

    res.json({ assetTypes: result.rows });
  } catch (error) {
    console.error('Get asset types error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách loại tài sản' });
  }
});

// Tạo loại tài sản mới
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('type_name').notEmpty().withMessage('Tên loại tài sản là bắt buộc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type_name, description } = req.body;

    // Kiểm tra tên loại tài sản đã tồn tại chưa
    const existingType = await pool.query(
      'SELECT id FROM asset_types WHERE type_name = $1',
      [type_name]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({ message: 'Tên loại tài sản đã tồn tại' });
    }

    const result = await pool.query(
      'INSERT INTO asset_types (type_name, description) VALUES ($1, $2) RETURNING *',
      [type_name, description]
    );

    res.status(201).json({
      message: 'Tạo loại tài sản thành công',
      assetType: result.rows[0]
    });
  } catch (error) {
    console.error('Create asset type error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo loại tài sản' });
  }
});

// Cập nhật loại tài sản
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('type_name').notEmpty().withMessage('Tên loại tài sản là bắt buộc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { type_name, description } = req.body;

    // Kiểm tra tên loại tài sản đã tồn tại chưa (trừ loại hiện tại)
    const existingType = await pool.query(
      'SELECT id FROM asset_types WHERE type_name = $1 AND id != $2',
      [type_name, id]
    );

    if (existingType.rows.length > 0) {
      return res.status(400).json({ message: 'Tên loại tài sản đã tồn tại' });
    }

    const result = await pool.query(
      'UPDATE asset_types SET type_name = $1, description = $2 WHERE id = $3 RETURNING *',
      [type_name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy loại tài sản' });
    }

    res.json({
      message: 'Cập nhật loại tài sản thành công',
      assetType: result.rows[0]
    });
  } catch (error) {
    console.error('Update asset type error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật loại tài sản' });
  }
});

// Xóa loại tài sản
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra loại tài sản có đang được sử dụng không
    const assetsUsingType = await pool.query(
      'SELECT id FROM assets WHERE asset_type_id = $1',
      [id]
    );

    if (assetsUsingType.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa loại tài sản đang được sử dụng' 
      });
    }

    const result = await pool.query('DELETE FROM asset_types WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy loại tài sản' });
    }

    res.json({ message: 'Xóa loại tài sản thành công' });
  } catch (error) {
    console.error('Delete asset type error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa loại tài sản' });
  }
});

module.exports = router;
