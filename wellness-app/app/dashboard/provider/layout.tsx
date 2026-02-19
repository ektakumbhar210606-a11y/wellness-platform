'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Typography, Avatar } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { UserOutlined, CalendarOutlined, BookOutlined, TeamOutlined, ShopOutlined, ProfileOutlined, MenuOutlined, DollarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface ProviderDashboardLayoutProps {
  children: React.ReactNode;
}

const ProviderDashboardLayout: React.FC<ProviderDashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  
  // Update selected key when URL changes
  useEffect(() => {
    const updateSelectedKey = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'services') setSelectedKey('services');
        else if (tab === 'bookings') setSelectedKey('bookings');
        else if (tab === 'requests') setSelectedKey('therapists');
        else if (tab === 'earnings') setSelectedKey('earnings');
        else if (tab === 'profile') setSelectedKey('profile');
        else if (tab === 'schedule') setSelectedKey('schedule');
        else setSelectedKey('dashboard');
      }
    };
    
    updateSelectedKey();
    
    // Listen for popstate events
    window.addEventListener('popstate', updateSelectedKey);
    
    // Poll for URL changes (since useSearchParams doesn't trigger re-renders in layout)
    const interval = setInterval(updateSelectedKey, 100);
    
    return () => {
      window.removeEventListener('popstate', updateSelectedKey);
      clearInterval(interval);
    };
  }, []);
  
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
      key: 'earnings',
      label: 'Earnings',
      icon: <DollarOutlined />,
      onClick: () => {
        router.push('/dashboard/provider?tab=earnings');
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
            selectedKeys={[selectedKey]}
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