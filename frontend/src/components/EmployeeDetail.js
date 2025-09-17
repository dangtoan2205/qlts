import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Descriptions,
  Avatar,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  DatePicker,
  Input
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  LaptopOutlined,
  HistoryOutlined,
  UndoOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EmployeeDetail = ({ employee, onBack, onRefresh }) => {
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (employee) {
      fetchEmployeeData();
    }
  }, [employee]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [assetsRes, assignmentsRes] = await Promise.all([
        axios.get(`/api/employees/${employee.id}/assets`),
        axios.get(`/api/employees/${employee.id}/assignments`)
      ]);
      
      setAssets(assetsRes.data.assets);
      setAssignments(assignmentsRes.data.assignments);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAsset = (asset) => {
    setSelectedAsset(asset);
    form.resetFields();
    setReturnModalVisible(true);
  };

  const handleReturnSubmit = async (values) => {
    try {
      const data = {
        return_date: values.return_date.format('YYYY-MM-DD'),
        notes: values.notes
      };

      // Tìm assignment ID từ asset
      const assignment = assignments.find(a => a.asset_id === selectedAsset.id && a.status === 'active');
      
      await axios.put(`/api/assignments/${assignment.id}/return`, data);
      message.success('Trả tài sản thành công');
      setReturnModalVisible(false);
      fetchEmployeeData();
      onRefresh(); // Refresh danh sách nhân viên
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi trả tài sản');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      available: { color: 'green', text: 'Khả dụng' },
      assigned: { color: 'blue', text: 'Đã bàn giao' },
      maintenance: { color: 'orange', text: 'Bảo trì' },
      retired: { color: 'red', text: 'Ngừng sử dụng' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const assetColumns = [
    {
      title: 'Mã tài sản',
      dataIndex: 'asset_code',
      key: 'asset_code',
      render: (text) => <span className="asset-code">{text}</span>,
    },
    {
      title: 'Tên tài sản',
      dataIndex: 'asset_name',
      key: 'asset_name',
    },
    {
      title: 'Loại',
      dataIndex: 'type_name',
      key: 'type_name',
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
      render: (text) => text || '-',
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (text) => text || '-',
    },
    {
      title: 'Ngày bàn giao',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<UndoOutlined />}
          onClick={() => handleReturnAsset(record)}
        >
          Trả tài sản
        </Button>
      ),
    },
  ];

  const assignmentColumns = [
    {
      title: 'Tài sản',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.asset_code}
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
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? 'Đang sử dụng' : 'Đã trả'}
        </Tag>
      ),
    },
  ];

  if (!employee) return null;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại
          </Button>
          <Title level={2} className="page-title" style={{ margin: 0 }}>
            Chi tiết nhân viên
          </Title>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Thông tin nhân viên */}
        <Col xs={24} lg={8}>
          <Card title="Thông tin nhân viên" className="card-container">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                {employee.full_name}
              </Title>
              <Text type="secondary">{employee.employee_id}</Text>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">
                {employee.email}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {employee.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {employee.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">
                {employee.position || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(employee.created_at).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Thống kê */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Tài sản đang sử dụng"
                  value={assets.length}
                  prefix={<LaptopOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Tổng bàn giao"
                  value={assignments.length}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Đã trả"
                  value={assignments.filter(a => a.status === 'returned').length}
                  prefix={<UndoOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Tỷ lệ sử dụng"
                  value={assignments.length > 0 ? Math.round((assets.length / assignments.length) * 100) : 0}
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Tài sản đang sử dụng */}
      <Card 
        title="Tài sản đang sử dụng" 
        extra={<LaptopOutlined />}
        className="card-container"
        style={{ marginTop: 24 }}
      >
        <Table
          columns={assetColumns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Nhân viên chưa có tài sản nào' }}
        />
      </Card>

      {/* Lịch sử bàn giao */}
      <Card 
        title="Lịch sử bàn giao" 
        extra={<HistoryOutlined />}
        className="card-container"
        style={{ marginTop: 24 }}
      >
        <Table
          columns={assignmentColumns}
          dataSource={assignments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bàn giao`,
          }}
        />
      </Card>

      {/* Modal trả tài sản */}
      <Modal
        title="Trả tài sản"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedAsset && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Tài sản:</strong> {selectedAsset.asset_name} ({selectedAsset.asset_code})</p>
            <p><strong>Nhân viên:</strong> {employee.full_name}</p>
            <p><strong>Ngày bàn giao:</strong> {new Date(selectedAsset.assigned_date).toLocaleDateString('vi-VN')}</p>
          </div>
        )}

        <Form
          form={form}
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
            <TextArea rows={3} placeholder="Ghi chú về việc trả tài sản" />
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

export default EmployeeDetail;
