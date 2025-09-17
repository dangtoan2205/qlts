import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  DatePicker,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  SwapOutlined,
  UndoOutlined,
  SearchOutlined,
  UserOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();

  useEffect(() => {
    fetchAssignments();
    fetchAssets();
    fetchEmployees();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/api/assignments', { params });
      setAssignments(response.data.assignments);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
    } catch (error) {
      message.error('Lỗi khi tải danh sách bàn giao');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets?status=available&limit=1000');
      setAssets(response.data.assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
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
    setFilters({ search: '', status: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAssign = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleReturn = (record) => {
    setSelectedAssignment(record);
    returnForm.resetFields();
    setReturnModalVisible(true);
  };

  const handleAssignSubmit = async (values) => {
    try {
      const data = {
        ...values,
        assigned_date: values.assigned_date.format('YYYY-MM-DD'),
        assigned_by: 'Admin' // In real app, get from auth context
      };

      await axios.post('/api/assignments', data);
      message.success('Bàn giao tài sản thành công');
      setModalVisible(false);
      fetchAssignments();
      fetchAssets(); // Refresh available assets
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi bàn giao tài sản');
    }
  };

  const handleReturnSubmit = async (values) => {
    try {
      const data = {
        return_date: values.return_date.format('YYYY-MM-DD'),
        notes: values.notes
      };

      await axios.put(`/api/assignments/${selectedAssignment.id}/return`, data);
      message.success('Trả tài sản thành công');
      setReturnModalVisible(false);
      fetchAssignments();
      fetchAssets(); // Refresh available assets
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi trả tài sản');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: 'green', text: 'Đang sử dụng' },
      returned: { color: 'default', text: 'Đã trả' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Tài sản',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.asset_code} - {record.type_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.employee_id}
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày bàn giao',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Ngày trả',
      dataIndex: 'return_date',
      key: 'return_date',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'active' && (
            <Button
              type="link"
              icon={<UndoOutlined />}
              onClick={() => handleReturn(record)}
            >
              Trả tài sản
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          Bàn giao tài sản
        </Title>
        <p className="page-description">
          Quản lý việc bàn giao và trả tài sản cho nhân viên
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
                  placeholder="Tìm kiếm bàn giao..."
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="status">
                <Select placeholder="Trạng thái" allowClear>
                  <Option value="active">Đang sử dụng</Option>
                  <Option value="returned">Đã trả</Option>
                </Select>
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
            onClick={handleAssign}
          >
            Bàn giao tài sản
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={assignments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bàn giao`,
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

      {/* Assignment Modal */}
      <Modal
        title="Bàn giao tài sản"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          <Form.Item
            name="asset_id"
            label="Tài sản"
            rules={[{ required: true, message: 'Vui lòng chọn tài sản' }]}
          >
            <Select placeholder="Chọn tài sản" showSearch optionFilterProp="children">
              {assets.map(asset => (
                <Option key={asset.id} value={asset.id}>
                  {asset.asset_name} ({asset.asset_code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="employee_id"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {employees.map(employee => (
                <Option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assigned_date"
            label="Ngày bàn giao"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bàn giao' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú về việc bàn giao" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Bàn giao
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Return Modal */}
      <Modal
        title="Trả tài sản"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedAssignment && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Tài sản:</strong> {selectedAssignment.asset_name} ({selectedAssignment.asset_code})</p>
            <p><strong>Nhân viên:</strong> {selectedAssignment.employee_name}</p>
            <p><strong>Ngày bàn giao:</strong> {new Date(selectedAssignment.assigned_date).toLocaleDateString('vi-VN')}</p>
          </div>
        )}

        <Form
          form={returnForm}
          layout="vertical"
          onFinish={handleReturnSubmit}
        >
          <Form.Item
            name="return_date"
            label="Ngày trả"
            rules={[{ required: true, message: 'Vui lòng chọn ngày trả' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú về việc trả tài sản" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReturnModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Xác nhận trả
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssignmentManagement;
