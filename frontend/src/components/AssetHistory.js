import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
  Timeline,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  LaptopOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const AssetHistory = ({ asset, onBack }) => {
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      fetchUsageHistory();
    }
  }, [asset]);

  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assets/${asset.id}/usage-history`);
      setUsageHistory(response.data.usageHistory);
    } catch (error) {
      console.error('Error fetching usage history:', error);
      message.error('Lỗi khi tải lịch sử sử dụng tài sản: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    return status === 'active' ? 'green' : 'blue';
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" icon={<UserOutlined />} />
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.employee_id} - {record.department}
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày bàn giao',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (date) => (
        <div>
          <div>{new Date(date).toLocaleDateString('vi-VN')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {new Date(date).toLocaleTimeString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày trả',
      dataIndex: 'return_date',
      key: 'return_date',
      render: (date, record) => (
        <div>
          {date ? (
            <>
              <div>{new Date(date).toLocaleDateString('vi-VN')}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {new Date(date).toLocaleTimeString('vi-VN')}
              </div>
            </>
          ) : (
            <Text type="secondary">Chưa trả</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian sử dụng',
      dataIndex: 'usage_days',
      key: 'usage_days',
      render: (days, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {days} ngày
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.status === 'active' ? 'Đang sử dụng' : 'Đã hoàn thành'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => text || '-',
    },
  ];

  if (!asset) return null;

  const totalUsers = usageHistory.length;
  const currentUser = usageHistory.find(h => h.status === 'active');
  const completedAssignments = usageHistory.filter(h => h.status === 'returned');
  const totalUsageDays = usageHistory.reduce((sum, h) => sum + (h.usage_days || 0), 0);

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại
          </Button>
          <Title level={2} className="page-title" style={{ margin: 0 }}>
            Lịch sử sử dụng tài sản
          </Title>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Thông tin tài sản */}
        <Col xs={24} lg={8}>
          <Card title="Thông tin tài sản" className="card-container">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<LaptopOutlined />} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                {asset.asset_name}
              </Title>
              <Text type="secondary" className="asset-code">{asset.asset_code}</Text>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Loại">
                {asset.type_name}
              </Descriptions.Item>
              <Descriptions.Item label="Thương hiệu">
                {asset.brand || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {asset.model || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Serial">
                {asset.serial_number || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(asset.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Người sử dụng hiện tại">
                {currentUser ? currentUser.employee_name : 'Chưa có'}
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
                  title="Tổng số người đã sử dụng"
                  value={totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Bàn giao hoàn thành"
                  value={completedAssignments.length}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Tổng ngày sử dụng"
                  value={totalUsageDays}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stats-card">
                <Statistic
                  title="Trung bình/người"
                  value={totalUsers > 0 ? Math.round(totalUsageDays / totalUsers) : 0}
                  suffix="ngày"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Timeline lịch sử */}
      <Card 
        title="Timeline lịch sử sử dụng" 
        extra={<ClockCircleOutlined />}
        className="card-container"
        style={{ marginTop: 24 }}
      >
        <Timeline>
          {usageHistory.map((record, index) => (
            <Timeline.Item
              key={record.id}
              color={getStatusColor(record.status)}
              dot={<Avatar size="small" icon={<UserOutlined />} />}
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong>{record.employee_name}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({record.employee_id})
                </Text>
                <Tag color={getStatusColor(record.status)} style={{ marginLeft: 8 }}>
                  {record.status === 'active' ? 'Đang sử dụng' : 'Đã trả'}
                </Tag>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>
                  <Text strong>Bàn giao:</Text> {new Date(record.assigned_date).toLocaleDateString('vi-VN')}
                </div>
                {record.return_date && (
                  <div>
                    <Text strong>Trả:</Text> {new Date(record.return_date).toLocaleDateString('vi-VN')}
                  </div>
                )}
                <div>
                  <Text strong>Thời gian:</Text> {record.usage_days} ngày
                </div>
                {record.notes && (
                  <div>
                    <Text strong>Ghi chú:</Text> {record.notes}
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* Bảng chi tiết */}
      <Card 
        title="Bảng chi tiết lịch sử" 
        extra={<HistoryOutlined />}
        className="card-container"
        style={{ marginTop: 24 }}
      >
        <Table
          columns={columns}
          dataSource={usageHistory}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bàn giao`,
          }}
          locale={{ emptyText: 'Chưa có lịch sử sử dụng' }}
        />
      </Card>
    </div>
  );
};

export default AssetHistory;
