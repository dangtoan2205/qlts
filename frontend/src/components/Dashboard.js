import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd';
import { 
  LaptopOutlined, 
  TeamOutlined, 
  SwapOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    assignedAssets: 0,
    availableAssets: 0,
    totalEmployees: 0,
    activeAssignments: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const [assetsRes, employeesRes, assignmentsRes] = await Promise.all([
        axios.get('/api/assets?limit=1000'),
        axios.get('/api/employees?limit=1000'),
        axios.get('/api/assignments?status=active&limit=1000')
      ]);

      const totalAssets = assetsRes.data.assets.length;
      const assignedAssets = assetsRes.data.assets.filter(asset => asset.status === 'assigned').length;
      const availableAssets = assetsRes.data.assets.filter(asset => asset.status === 'available').length;
      const totalEmployees = employeesRes.data.employees.length;
      const activeAssignments = assignmentsRes.data.assignments.length;

      setStats({
        totalAssets,
        assignedAssets,
        availableAssets,
        totalEmployees,
        activeAssignments
      });

      // Fetch recent assignments
      const recentRes = await axios.get('/api/assignments?limit=5');
      setRecentAssignments(recentRes.data.assignments);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Ngày bàn giao',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">
          Tổng quan hệ thống
        </Title>
        <p className="page-description">
          Thống kê và theo dõi tài sản IT trong công ty
        </p>
      </div>

      <Row gutter={[24, 24]} className="dashboard-grid">
        <Col xs={24} sm={12} lg={6} style={{ maxWidth: '100%' }}>
          <Card className="stats-card">
            <Statistic
              title="Tổng số tài sản"
              value={stats.totalAssets}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6} style={{ maxWidth: '100%' }}>
          <Card className="stats-card">
            <Statistic
              title="Tài sản đang sử dụng"
              value={stats.assignedAssets}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6} style={{ maxWidth: '100%' }}>
          <Card className="stats-card">
            <Statistic
              title="Tài sản khả dụng"
              value={stats.availableAssets}
              prefix={<LaptopOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6} style={{ maxWidth: '100%' }}>
          <Card className="stats-card">
            <Statistic
              title="Tổng số nhân viên"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title="Bàn giao tài sản gần đây" 
            extra={<SwapOutlined />}
            className="card-container"
          >
            <Table
              columns={assignmentColumns}
              dataSource={recentAssignments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title="Thống kê nhanh" 
            className="card-container"
          >
            <div style={{ textAlign: 'center' }}>
              <div className="stats-number" style={{ color: '#52c41a' }}>
                {stats.activeAssignments}
              </div>
              <p className="stats-title">Bàn giao đang hoạt động</p>
              
              <div style={{ marginTop: '24px' }}>
                <div className="stats-number" style={{ color: '#1890ff', fontSize: '24px' }}>
                  {stats.totalAssets > 0 ? Math.round((stats.assignedAssets / stats.totalAssets) * 100) : 0}%
                </div>
                <p className="stats-title">Tỷ lệ sử dụng tài sản</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
