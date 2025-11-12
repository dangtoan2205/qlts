import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Input, Space, Typography, Descriptions, Modal, Button } from 'antd';
import { 
  HistoryOutlined, 
  SearchOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    username: ''
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get('/api/activity-logs', { params });
      setLogs(response.data.logs);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalItems
      }));
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (record) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const getActionTypeTag = (actionType) => {
    const config = {
      create: { color: 'green', text: 'Tạo mới' },
      update: { color: 'blue', text: 'Cập nhật' },
      delete: { color: 'red', text: 'Xóa' },
      assign: { color: 'orange', text: 'Bàn giao' },
      return: { color: 'purple', text: 'Trả lại' }
    };
    const item = config[actionType] || { color: 'default', text: actionType };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const getEntityTypeText = (entityType) => {
    const map = {
      asset: 'Tài sản',
      employee: 'Nhân viên',
      assignment: 'Bàn giao tài sản'
    };
    return map[entityType] || entityType;
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => (
        <div>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {dayjs(date).format('DD/MM/YYYY HH:mm:ss')}
        </div>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (text, record) => (
        <div>
          <UserOutlined style={{ marginRight: 4 }} />
          <span>{text}</span>
          {record.user_role === 'admin' && (
            <Tag color="red" style={{ marginLeft: 4 }}>Admin</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 120,
      render: getActionTypeTag,
    },
    {
      title: 'Loại',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 120,
      render: getEntityTypeText,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          <HistoryOutlined style={{ marginRight: 8 }} />
          Lịch sử thay đổi
        </Title>
        <p className="page-description">
          Theo dõi tất cả các thay đổi trong hệ thống quản lý tài sản
        </p>
      </div>

      <Card className="card-container">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space wrap>
            <Input
              placeholder="Tìm theo tên người dùng..."
              prefix={<SearchOutlined />}
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Loại hành động"
              value={filters.action_type}
              onChange={(value) => handleFilterChange('action_type', value)}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="create">Tạo mới</Option>
              <Option value="update">Cập nhật</Option>
              <Option value="delete">Xóa</Option>
              <Option value="assign">Bàn giao</Option>
              <Option value="return">Trả lại</Option>
            </Select>
            <Select
              placeholder="Loại entity"
              value={filters.entity_type}
              onChange={(value) => handleFilterChange('entity_type', value)}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="asset">Tài sản</Option>
              <Option value="employee">Nhân viên</Option>
              <Option value="assignment">Bàn giao</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bản ghi`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || prev.pageSize
                }));
              }
            }}
          />
        </Space>
      </Card>

      <Modal
        title="Chi tiết thay đổi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedLog.created_at).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              {selectedLog.username} {selectedLog.user_role === 'admin' && <Tag color="red">Admin</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Hành động">
              {getActionTypeTag(selectedLog.action_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {getEntityTypeText(selectedLog.entity_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedLog.description || '-'}
            </Descriptions.Item>
            {selectedLog.old_values && (
              <Descriptions.Item label="Giá trị cũ">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedLog.new_values && (
              <Descriptions.Item label="Giá trị mới">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ActivityLog;

