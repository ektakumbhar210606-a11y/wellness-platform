'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Avatar } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, CalendarOutlined, BookOutlined, TeamOutlined, ShopOutlined, ProfileOutlined, MenuOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface ProviderDashboardLayoutProps {
  children: React.ReactNode;
}

const ProviderDashboardLayout: React.FC<ProviderDashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <UserOutlined />,
      onClick: () => {
        router.push('/dashboard/provider');
      },
    },
    {
      key: 'services',
      label: 'Services',
      icon: <ShopOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=services');
      },
    },
    {
      key: 'bookings',
      label: 'Bookings',
      icon: <BookOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=bookings');
      },
    },
    {
      key: 'therapists',
      label: 'Therapists',
      icon: <TeamOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=requests');
      },
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <ProfileOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=profile');
      },
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: <CalendarOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=schedule');
      },
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: () => {
        logout();
        router.push('/');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ float: 'left', padding: '0 24px', fontSize: '20px', fontWeight: 'bold', lineHeight: '64px' }}>
          Provider Dashboard
        </div>
        <div style={{ float: 'right', padding: '0 24px', lineHeight: '64px' }}>
          <Space>
            <Text strong>{user?.name || 'Provider'}</Text>
            <Avatar icon={<UserOutlined />} />
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={(value) => setCollapsed(value)}
          style={{ background: '#fff', padding: '24px 0' }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280, borderRadius: 8 }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ProviderDashboardLayout;