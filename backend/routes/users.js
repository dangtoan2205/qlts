const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity, generateDescription } = require('../utils/activityLogger');

const router = express.Router();

// Lấy danh sách tất cả users (chỉ admin)
router.get('/', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at,
             e.full_name as employee_name, e.employee_id
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM users u';
    let params = [];
    let paramCount = 0;

    if (search) {
      query += ` WHERE u.username ILIKE $${++paramCount} OR u.email ILIKE $${paramCount}`;
      countQuery += ` WHERE u.username ILIKE $1 OR u.email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    // Lấy permissions cho mỗi user
    const users = await Promise.all(
      usersResult.rows.map(async (user) => {
        const permissionsResult = await pool.query(
          'SELECT * FROM user_permissions WHERE user_id = $1',
          [user.id]
        );
        return {
          ...user,
          permissions: permissionsResult.rows
        };
      })
    );

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách users' });
  }
});

// Lấy thông tin user theo ID
router.get('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT u.*, e.full_name as employee_name, e.employee_id
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    const permissionsResult = await pool.query(
      'SELECT * FROM user_permissions WHERE user_id = $1',
      [id]
    );

    res.json({
      user: {
        ...userResult.rows[0],
        permissions: permissionsResult.rows
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin user' });
  }
});

// Tạo user mới
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('username').notEmpty().withMessage('Username là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'user', employee_id, is_active = true, permissions } = req.body;

    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user
    const userResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, employee_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [username, email, passwordHash, role, employee_id, is_active]
    );

    const newUser = userResult.rows[0];

    // Tạo permissions nếu có
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        await pool.query(
          `INSERT INTO user_permissions (user_id, entity_type, can_view, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, entity_type) 
           DO UPDATE SET can_view = $3, can_edit = $4, can_delete = $5, updated_at = CURRENT_TIMESTAMP`,
          [newUser.id, perm.entity_type, perm.can_view || false, perm.can_edit || false, perm.can_delete || false]
        );
      }
    }

    // Ghi log
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'create',
      entityType: 'user',
      entityId: newUser.id,
      entityName: username,
      newValues: { ...newUser, permissions },
      description: `Tạo user mới: ${username}`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      message: 'Tạo user thành công',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo user' });
  }
});

// Cập nhật user
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('email').optional().isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, role, employee_id, is_active, password, permissions } = req.body;

    // Lấy user hiện tại
    const oldUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (oldUserResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    const oldUser = oldUserResult.rows[0];

    // Kiểm tra email đã tồn tại chưa (trừ user hiện tại)
    if (email && email !== oldUser.email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
    }

    // Cập nhật user
    let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const updateParams = [];
    let paramCount = 0;

    if (email !== undefined) {
      updateQuery += `, email = $${++paramCount}`;
      updateParams.push(email);
    }
    if (role !== undefined) {
      updateQuery += `, role = $${++paramCount}`;
      updateParams.push(role);
    }
    if (employee_id !== undefined) {
      updateQuery += `, employee_id = $${++paramCount}`;
      updateParams.push(employee_id);
    }
    if (is_active !== undefined) {
      updateQuery += `, is_active = $${++paramCount}`;
      updateParams.push(is_active);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $${++paramCount}`;
      updateParams.push(passwordHash);
    }

    updateQuery += ` WHERE id = $${++paramCount} RETURNING *`;
    updateParams.push(id);

    const userResult = await pool.query(updateQuery, updateParams);
    const updatedUser = userResult.rows[0];

    // Cập nhật permissions nếu có
    if (permissions && Array.isArray(permissions)) {
      // Xóa permissions cũ
      await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);

      // Thêm permissions mới
      for (const perm of permissions) {
        await pool.query(
          `INSERT INTO user_permissions (user_id, entity_type, can_view, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, perm.entity_type, perm.can_view || false, perm.can_edit || false, perm.can_delete || false]
        );
      }
    }

    // Ghi log
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'update',
      entityType: 'user',
      entityId: updatedUser.id,
      entityName: updatedUser.username,
      oldValues: oldUser,
      newValues: updatedUser,
      description: `Cập nhật user: ${updatedUser.username}`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      message: 'Cập nhật user thành công',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật user' });
  }
});

// Xóa user
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    // Không cho phép xóa chính mình
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Không thể xóa chính tài khoản của bạn' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    const user = userResult.rows[0];

    // Xóa user (permissions sẽ tự động xóa do CASCADE)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    // Ghi log
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'delete',
      entityType: 'user',
      entityId: user.id,
      entityName: user.username,
      oldValues: user,
      description: `Xóa user: ${user.username}`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Xóa user thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa user' });
  }
});

// Cập nhật permissions cho user
router.put('/:id/permissions', [
  authenticateToken,
  requireAdmin,
  body('permissions').isArray().withMessage('Permissions phải là mảng')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { permissions } = req.body;

    // Kiểm tra user có tồn tại không
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // Xóa permissions cũ
    await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);

    // Thêm permissions mới
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO user_permissions (user_id, entity_type, can_view, can_edit, can_delete)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, perm.entity_type, perm.can_view || false, perm.can_edit || false, perm.can_delete || false]
      );
    }

    // Ghi log
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'update',
      entityType: 'user',
      entityId: id,
      entityName: userResult.rows[0].username,
      newValues: { permissions },
      description: `Cập nhật quyền cho user: ${userResult.rows[0].username}`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Cập nhật quyền thành công' });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật quyền' });
  }
});

module.exports = router;

