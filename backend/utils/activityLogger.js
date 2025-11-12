const pool = require('../config/database');

/**
 * Ghi log hoạt động của người dùng
 * @param {Object} options - Các thông tin về hoạt động
 * @param {number} options.userId - ID của người dùng
 * @param {string} options.username - Tên đăng nhập
 * @param {string} options.actionType - Loại hành động (create, update, delete, assign, return)
 * @param {string} options.entityType - Loại entity (asset, employee, assignment)
 * @param {number} options.entityId - ID của entity
 * @param {string} options.entityName - Tên của entity
 * @param {Object} options.oldValues - Giá trị cũ (cho update/delete)
 * @param {Object} options.newValues - Giá trị mới (cho create/update)
 * @param {string} options.description - Mô tả chi tiết
 * @param {string} options.ipAddress - Địa chỉ IP
 */
const logActivity = async ({
  userId,
  username,
  actionType,
  entityType,
  entityId = null,
  entityName = null,
  oldValues = null,
  newValues = null,
  description = null,
  ipAddress = null
}) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs 
       (user_id, username, action_type, entity_type, entity_id, entity_name, 
        old_values, new_values, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        username,
        actionType,
        entityType,
        entityId,
        entityName,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        description,
        ipAddress
      ]
    );
  } catch (error) {
    // Không throw error để không làm gián đoạn flow chính
    console.error('Error logging activity:', error);
  }
};

/**
 * Tạo mô tả tự động từ action và entity
 */
const generateDescription = (actionType, entityType, entityName) => {
  const actionMap = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
    assign: 'Bàn giao',
    return: 'Trả lại'
  };

  const entityMap = {
    asset: 'tài sản',
    employee: 'nhân viên',
    assignment: 'bàn giao tài sản'
  };

  const action = actionMap[actionType] || actionType;
  const entity = entityMap[entityType] || entityType;

  if (entityName) {
    return `${action} ${entity}: ${entityName}`;
  }
  return `${action} ${entity}`;
};

module.exports = { logActivity, generateDescription };

