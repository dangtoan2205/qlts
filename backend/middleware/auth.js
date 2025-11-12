const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token truy cập không được cung cấp' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra user có tồn tại và active không
    const userResult = await pool.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Cần quyền admin để thực hiện hành động này' });
  }
  next();
};

// Middleware kiểm tra quyền xóa - chỉ admin mới được xóa
const requireDeletePermission = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa. Chỉ admin mới có quyền xóa.' });
  }
  next();
};

// Middleware kiểm tra quyền chỉnh sửa dựa trên permissions
const requireEditPermission = (entityType) => {
  return async (req, res, next) => {
    try {
      // Admin luôn có toàn quyền
      if (req.user.role === 'admin') {
        return next();
      }

      // Kiểm tra permission trong database
      const permissionResult = await pool.query(
        'SELECT can_edit FROM user_permissions WHERE user_id = $1 AND entity_type = $2',
        [req.user.id, entityType]
      );

      if (permissionResult.rows.length === 0 || !permissionResult.rows[0].can_edit) {
        return res.status(403).json({ 
          message: `Bạn không có quyền chỉnh sửa ${entityType}. Vui lòng liên hệ admin để được cấp quyền.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Lỗi khi kiểm tra quyền' });
    }
  };
};

// Middleware kiểm tra quyền xóa dựa trên permissions
const requireDeletePermissionByEntity = (entityType) => {
  return async (req, res, next) => {
    try {
      // Admin luôn có toàn quyền
      if (req.user.role === 'admin') {
        return next();
      }

      // Kiểm tra permission trong database
      const permissionResult = await pool.query(
        'SELECT can_delete FROM user_permissions WHERE user_id = $1 AND entity_type = $2',
        [req.user.id, entityType]
      );

      if (permissionResult.rows.length === 0 || !permissionResult.rows[0].can_delete) {
        return res.status(403).json({ 
          message: `Bạn không có quyền xóa ${entityType}. Chỉ admin mới có quyền xóa.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Lỗi khi kiểm tra quyền' });
    }
  };
};

// Middleware kiểm tra quyền xem dựa trên permissions
const requireViewPermission = (entityType) => {
  return async (req, res, next) => {
    try {
      // Admin luôn có toàn quyền
      if (req.user.role === 'admin') {
        return next();
      }

      // Kiểm tra permission trong database
      const permissionResult = await pool.query(
        'SELECT can_view FROM user_permissions WHERE user_id = $1 AND entity_type = $2',
        [req.user.id, entityType]
      );

      if (permissionResult.rows.length === 0 || !permissionResult.rows[0].can_view) {
        return res.status(403).json({ 
          message: `Bạn không có quyền xem ${entityType}. Vui lòng liên hệ admin để được cấp quyền.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Lỗi khi kiểm tra quyền' });
    }
  };
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  requireDeletePermission,
  requireEditPermission,
  requireDeletePermissionByEntity,
  requireViewPermission
};
