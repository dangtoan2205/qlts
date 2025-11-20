import React, { useState } from 'react';
import { Layout, Menu, Modal, Radio, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  LaptopOutlined,
  TeamOutlined,
  SwapOutlined,
  SettingOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [exporting, setExporting] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/assets',
      icon: <LaptopOutlined />,
      label: 'Quản lý tài sản',
    },
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: 'Quản lý nhân viên',
    },
    {
      key: '/assignments',
      icon: <SwapOutlined />,
      label: 'Bàn giao tài sản',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: 'Export dữ liệu',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'export') {
      setExportModalVisible(true);
    } else {
      navigate(key);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      let url = '/api/export/all';
      
      if (exportType === 'user' && user?.id) {
        url = `/api/export/user/${user.id}`;
      }

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Tạo tên file
      const date = new Date();
      const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      const filename = exportType === 'all' 
        ? `export-all-data-${dateStr}.xlsx`
        : `export-data-user-${dateStr}.xlsx`;

      // Tạo link download
      const url_blob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url_blob;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url_blob);

      message.success('Xuất dữ liệu thành công!');
      setExportModalVisible(false);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Lỗi khi xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: '#001529',
        minHeight: '100vh',
      }}
    >
      <div style={{
        height: 64,
        margin: 16,
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: collapsed ? '14px' : '16px'
      }}>
        {collapsed ? 'QLTS' : 'QLTS SETA'}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />

      <Modal
        title="Export dữ liệu"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            Xuất dữ liệu
          </Button>
        ]}
      >
        <Radio.Group
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          style={{ width: '100%' }}
        >
          <Radio value="all" style={{ display: 'block', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 500 }}>Export dữ liệu toàn bộ</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4 }}>
                Xuất tất cả dữ liệu: Tài sản, Nhân viên, Bàn giao tài sản
              </div>
            </div>
          </Radio>
          <Radio value="user" style={{ display: 'block' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Export dữ liệu theo user</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4 }}>
                Xuất dữ liệu của user hiện tại: Tài sản đã bàn giao, Lịch sử hoạt động
              </div>
            </div>
          </Radio>
        </Radio.Group>
      </Modal>
    </Sider>
  );
};

export default Sidebar;
