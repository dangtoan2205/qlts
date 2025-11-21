import React, { useState } from 'react';
import { Layout, Menu, Modal, Radio, Button, message, Upload, Select, Alert } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  LaptopOutlined,
  TeamOutlined,
  SwapOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importType, setImportType] = useState('assets');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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
    {
      key: 'import',
      icon: <UploadOutlined />,
      label: 'Import dữ liệu',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'export') {
      setExportModalVisible(true);
    } else if (key === 'import') {
      setImportModalVisible(true);
      setImportResult(null);
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

  const handleImport = async (file) => {
    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const url = `/api/import/${importType}`;
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setImportResult(response.data);
      message.success(`Import thành công: ${response.data.success} bản ghi, ${response.data.errors} lỗi`);
      
      // Reload trang sau 2 giây nếu import thành công
      if (response.data.success > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      message.error(error.response?.data?.message || 'Lỗi khi import dữ liệu');
    } finally {
      setImporting(false);
    }
    return false; // Ngăn upload tự động
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

      <Modal
        title="Import dữ liệu"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportResult(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setImportModalVisible(false);
            setImportResult(null);
          }}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Chọn loại dữ liệu import:</div>
          <Select
            value={importType}
            onChange={setImportType}
            style={{ width: '100%' }}
            disabled={importing}
          >
            <Select.Option value="assets">Tài sản</Select.Option>
            <Select.Option value="employees">Nhân viên</Select.Option>
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Chọn file Excel:</div>
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={handleImport}
            showUploadList={false}
            disabled={importing}
          >
            <Button
              icon={<UploadOutlined />}
              loading={importing}
              disabled={importing}
              type="primary"
            >
              {importing ? 'Đang import...' : 'Chọn file Excel'}
            </Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
            Chỉ chấp nhận file .xlsx hoặc .xls. File phải có format giống file export.
          </div>
        </div>

        {importResult && (
          <div>
            <Alert
              message={`Import hoàn tất: ${importResult.success} thành công, ${importResult.errors} lỗi`}
              type={importResult.errors > 0 ? 'warning' : 'success'}
              style={{ marginBottom: 16 }}
            />
            {importResult.details && importResult.details.errors.length > 0 && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Chi tiết lỗi:</div>
                <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: '12px' }}>
                  {importResult.details.errors.map((error, index) => (
                    <div key={index} style={{ color: 'red', marginBottom: 4 }}>
                      Dòng {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Sider>
  );
};

export default Sidebar;
