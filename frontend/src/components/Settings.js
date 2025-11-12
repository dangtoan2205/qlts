import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Switch,
  Tag,
  Typography,
  Row,
  Col,
  Checkbox,
  Select,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const Settings = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
      fetchEmployees();
    }
  }, [pagination.current, pagination.pageSize, filters, currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/api/users', { params });
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
    } catch (error) {
      message.error('Lỗi khi tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees?limit=1000');
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({ search: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
      employee_id: record.employee_id,
      is_active: record.is_active
    });
    setModalVisible(true);
  };

  const handleManagePermissions = (record) => {
    setSelectedUser(record);
    
    // Khởi tạo permissions mặc định
    const entityTypes = ['asset', 'employee', 'assignment'];
    const defaultPermissions = entityTypes.map(entityType => {
      const existingPerm = record.permissions?.find(p => p.entity_type === entityType);
      return {
        entity_type: entityType,
        can_view: existingPerm?.can_view ?? true,
        can_edit: existingPerm?.can_edit ?? false,
        can_delete: existingPerm?.can_delete ?? false
      };
    });

    permissionForm.setFieldsValue({ permissions: defaultPermissions });
    setPermissionModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('Xóa user thành công');
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa user');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, values);
        message.success('Cập nhật user thành công');
      } else {
        await axios.post('/api/users', values);
        message.success('Tạo user thành công');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu user');
    }
  };

  const handlePermissionSubmit = async (values) => {
    try {
      await axios.put(`/api/users/${selectedUser.id}/permissions`, {
        permissions: values.permissions
      });
      message.success('Cập nhật quyền thành công');
      setPermissionModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền');
    }
  };

  const getEntityTypeName = (entityType) => {
    const map = {
      asset: 'Tài sản',
      employee: 'Nhân viên',
      assignment: 'Bàn giao tài sản'
    };
    return map[entityType] || entityType;
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.role === 'admin' && (
            <Tag color="red" style={{ marginTop: 4 }}>Admin</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text) => text || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Quyền',
      key: 'permissions',
      render: (_, record) => {
        if (record.role === 'admin') {
          return <Tag color="red">Toàn quyền</Tag>;
        }
        const permCount = record.permissions?.length || 0;
        return permCount > 0 ? (
          <Tag color="blue">{permCount} quyền</Tag>
        ) : (
          <Tag color="default">Chưa có quyền</Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<SafetyOutlined />}
            onClick={() => handleManagePermissions(record)}
          >
            Quyền
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa user này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Chỉ admin mới được xem
  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Bạn không có quyền truy cập trang này</Title>
        <p>Chỉ admin mới có quyền quản lý users và permissions</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          <SettingOutlined style={{ marginRight: 8 }} />
          Quản lý người dùng
        </Title>
        <p className="page-description">
          Quản lý tài khoản và phân quyền cho người dùng hệ thống
        </p>
      </div>

      <Card className="card-container">
        <Form
          layout="inline"
          onFinish={handleSearch}
          className="search-form"
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="search">
                <Input
                  placeholder="Tìm kiếm user..."
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  Tìm kiếm
                </Button>
                <Button onClick={handleReset}>Làm mới</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm user mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} users`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || prev.pageSize
              }));
            }
          }}
        />
      </Card>

      {/* User Modal */}
      <Modal
        title={editingUser ? 'Sửa user' : 'Thêm user mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Vui lòng nhập username' }]}
          >
            <Input 
              placeholder="Username" 
              disabled={!!editingUser}
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="email@company.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              ]}
            >
              <Input.Password 
                placeholder="Mật khẩu" 
                prefix={<LockOutlined />}
              />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu mới (để trống nếu không đổi)"
            >
              <Input.Password 
                placeholder="Để trống nếu không đổi mật khẩu" 
                prefix={<LockOutlined />}
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="employee_id"
            label="Nhân viên (tùy chọn)"
          >
            <Select 
              placeholder="Chọn nhân viên" 
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu hóa" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Modal */}
      <Modal
        title={`Phân quyền cho user: ${selectedUser?.username}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSubmit}
        >
          <Form.List name="permissions">
            {(fields) => (
              <>
                {fields.map((field, index) => {
                  const entityType = permissionForm.getFieldValue(['permissions', field.name, 'entity_type']);
                  return (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 16 }}
                      title={getEntityTypeName(entityType)}
                    >
                      <Form.Item
                        name={[field.name, 'entity_type']}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'can_view']}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Checkbox>Xem</Checkbox>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'can_edit']}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Checkbox>Chỉnh sửa</Checkbox>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[field.name, 'can_delete']}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                          >
                            <Checkbox>Xóa</Checkbox>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPermissionModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Lưu quyền
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;

