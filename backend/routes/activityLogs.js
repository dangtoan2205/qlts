const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách lịch sử thay đổi
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action_type = '', entity_type = '', username = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM activity_logs al';
    let params = [];
    let paramCount = 0;
    let whereConditions = [];

    if (action_type) {
      whereConditions.push(`al.action_type = $${++paramCount}`);
      params.push(action_type);
    }

    if (entity_type) {
      whereConditions.push(`al.entity_type = $${++paramCount}`);
      params.push(entity_type);
    }

    if (username) {
      whereConditions.push(`al.username ILIKE $${++paramCount}`);
      params.push(`%${username}%`);
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    // Parse JSONB fields
    const logs = logsResult.rows.map(log => ({
      ...log,
      old_values: log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null,
      new_values: log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null
    }));

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử thay đổi' });
  }
});

// Lấy lịch sử thay đổi của một entity cụ thể
router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const result = await pool.query(
      `SELECT al.*, u.role as user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2
       ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );

    const logs = result.rows.map(log => ({
      ...log,
      old_values: log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null,
      new_values: log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null
    }));

    res.json({ logs });
  } catch (error) {
    console.error('Get entity activity logs error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử thay đổi của entity' });
  }
});

module.exports = router;

