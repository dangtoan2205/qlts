/**
 * Helper functions để kiểm tra permissions của user
 */

/**
 * Kiểm tra user có quyền xem entity type không
 * @param {Object} user - User object từ AuthContext
 * @param {string} entityType - Loại entity (asset, employee, assignment)
 * @returns {boolean}
 */
export const canView = (user, entityType) => {
  if (!user) return false;
  
  // Admin luôn có toàn quyền
  if (user.role === 'admin') return true;
  
  // Kiểm tra permission trong permissions array
  const permission = user.permissions?.find(p => p.entity_type === entityType);
  return permission?.can_view === true;
};

/**
 * Kiểm tra user có quyền chỉnh sửa entity type không
 * @param {Object} user - User object từ AuthContext
 * @param {string} entityType - Loại entity (asset, employee, assignment)
 * @returns {boolean}
 */
export const canEdit = (user, entityType) => {
  if (!user) return false;
  
  // Admin luôn có toàn quyền
  if (user.role === 'admin') return true;
  
  // Kiểm tra permission trong permissions array
  const permission = user.permissions?.find(p => p.entity_type === entityType);
  return permission?.can_edit === true;
};

/**
 * Kiểm tra user có quyền xóa entity type không
 * @param {Object} user - User object từ AuthContext
 * @param {string} entityType - Loại entity (asset, employee, assignment)
 * @returns {boolean}
 */
export const canDelete = (user, entityType) => {
  if (!user) return false;
  
  // Admin luôn có toàn quyền
  if (user.role === 'admin') return true;
  
  // Kiểm tra permission trong permissions array
  const permission = user.permissions?.find(p => p.entity_type === entityType);
  return permission?.can_delete === true;
};

/**
 * Kiểm tra user có quyền tạo mới entity type không
 * (Hiện tại chỉ admin mới có quyền tạo mới)
 * @param {Object} user - User object từ AuthContext
 * @param {string} entityType - Loại entity (asset, employee, assignment)
 * @returns {boolean}
 */
export const canCreate = (user, entityType) => {
  if (!user) return false;
  
  // Admin luôn có toàn quyền
  if (user.role === 'admin') return true;
  
  // Có thể mở rộng sau để kiểm tra permission can_create
  return false;
};

