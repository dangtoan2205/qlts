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
  InputNumber,
  DatePicker,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AssetHistory from './AssetHistory';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    asset_type: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAssets();
    fetchAssetTypes();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/api/assets', { params });
      setAssets(response.data.assets);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài sản');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get('/api/asset-types');
      setAssetTypes(response.data.assetTypes);
    } catch (error) {
      console.error('Error fetching asset types:', error);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({ search: '', status: '', asset_type: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingAsset(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingAsset(record);
    form.setFieldsValue({
      ...record,
      purchase_date: record.purchase_date ? dayjs(record.purchase_date) : null
    });
    setModalVisible(true);
  };

  const handleViewHistory = (record) => {
    setSelectedAsset(record);
  };

  const handleBackToList = () => {
    setSelectedAsset(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/assets/${id}`);
      message.success('Xóa tài sản thành công');
      fetchAssets();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa tài sản');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null
      };

      if (editingAsset) {
        await axios.put(`/api/assets/${editingAsset.id}`, data);
        message.success('Cập nhật tài sản thành công');
      } else {
        await axios.post('/api/assets', data);
        message.success('Tạo tài sản thành công');
      }

      setModalVisible(false);
      fetchAssets();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu tài sản');
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

  const columns = [
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
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Người sử dụng',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      render: (text, record) => (
        text ? (
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.assigned_to_id}
            </div>
          </div>
        ) : '-'
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            Lịch sử
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài sản này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Nếu có tài sản được chọn, hiển thị lịch sử
  if (selectedAsset) {
    return (
      <AssetHistory
        asset={selectedAsset}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          Quản lý tài sản
        </Title>
        <p className="page-description">
          Quản lý danh sách tài sản IT trong công ty
        </p>
      </div>

      <Card className="card-container">
        <Form
          layout="inline"
          onFinish={handleSearch}
          className="search-form"
        >
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="search">
                <Input
                  placeholder="Tìm kiếm tài sản..."
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="status">
                <Select placeholder="Trạng thái" allowClear>
                  <Option value="available">Khả dụng</Option>
                  <Option value="assigned">Đã bàn giao</Option>
                  <Option value="maintenance">Bảo trì</Option>
                  <Option value="retired">Ngừng sử dụng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="asset_type">
                <Select placeholder="Loại tài sản" allowClear>
                  {assetTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.type_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
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
            Thêm tài sản
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} tài sản`,
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

      <Modal
        title={editingAsset ? 'Sửa tài sản' : 'Thêm tài sản mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="asset_code"
                label="Mã tài sản"
                rules={[{ required: true, message: 'Vui lòng nhập mã tài sản' }]}
              >
                <Input placeholder="VD: PC001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="asset_name"
                label="Tên tài sản"
                rules={[{ required: true, message: 'Vui lòng nhập tên tài sản' }]}
              >
                <Input placeholder="VD: Máy tính để bàn Dell" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="asset_type_id"
                label="Loại tài sản"
                rules={[{ required: true, message: 'Vui lòng chọn loại tài sản' }]}
              >
                <Select placeholder="Chọn loại tài sản">
                  {assetTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.type_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select placeholder="Chọn trạng thái">
                  <Option value="available">Khả dụng</Option>
                  <Option value="assigned">Đã bàn giao</Option>
                  <Option value="maintenance">Bảo trì</Option>
                  <Option value="retired">Ngừng sử dụng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brand" label="Thương hiệu">
                <Input placeholder="VD: Dell, HP, Lenovo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model">
                <Input placeholder="VD: OptiPlex 7090" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serial_number" label="Số serial">
                <Input placeholder="Số serial thiết bị" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_date" label="Ngày mua">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchase_price" label="Giá mua">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Vị trí">
                <Input placeholder="VD: Tầng 2, Phòng IT" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm về tài sản" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAsset ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetManagement;
