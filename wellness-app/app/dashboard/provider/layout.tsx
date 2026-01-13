'use client';

import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { 
  CalendarOutlined, 
  ShopOutlined, 
  UserOutlined, 
  DollarOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const { Sider, Content } = Layout;

const ProviderDashboardLayout = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Check if user is authenticated and has provider role
  if (!isAuthenticated || !user || (user.role.toLowerCase() !== 'provider' && user.role.toLowerCase() !== 'business')) {
    router.push('/'); // Redirect to home if not authenticated or not a provider
    return null;
  }

  // Menu items for provider dashboard
  const menuItems = [
    {
      key: '/dashboard/provider',
      label: 'Dashboard',
      icon: <BarChartOutlined />,
      onClick: () => router.push('/dashboard/provider'),
    },
    {
      key: '/dashboard/provider/calendar',
      label: 'Calendar',
      icon: <CalendarOutlined />,
      onClick: () => router.push('/dashboard/provider/calendar'),
    },
    {
      key: '/dashboard/provider/services',
      label: 'Services',
      icon: <ShopOutlined />,
      onClick: () => router.push('/dashboard/provider/services'),
    },
    {
      key: '/dashboard/provider/profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => router.push('/dashboard/provider/profile'),
    },
    {
      key: '/dashboard/provider/earnings',
      label: 'Earnings',
      icon: <DollarOutlined />,
      onClick: () => router.push('/dashboard/provider/earnings'),
    },
  ];

  // Determine the selected menu item based on current path
  const selectedKey = menuItems.some(item => pathname === item.key) 
    ? pathname 
    : '/dashboard/provider';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{ background: colorBgContainer }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          {!collapsed && 'Provider Dashboard'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProviderDashboardLayout;