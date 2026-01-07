'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Grid } from 'antd';
import { MenuOutlined, UserOutlined, TeamOutlined, ShopOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

const Navbar: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const menuItems: MenuItem[] = [
    {
      key: 'home',
      label: 'Home',
    },
    {
      key: 'services',
      label: 'Services',
    },
    {
      key: 'how-it-works',
      label: 'How It Works',
    },
    {
      key: 'about',
      label: 'About Us',
    },
  ];

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <Header
      style={{
        position: 'fixed',
        top: 0,
        zIndex: 1000,
        width: '100vw',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        left: 0,
        right: 0,
      }}
    >
      {/* Container for content with proper padding */}
      <div style={{ width: '100%', paddingLeft: isMobile ? '16px' : '20px', paddingRight: isMobile ? '16px' : '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          {/* Logo */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flexShrink: 0,
              minWidth: 'fit-content',
            }}
          >
            <div
              style={{
                fontSize: isMobile ? '18px' : '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                whiteSpace: 'nowrap',
              }}
            >
              🧘‍♀️ Serenity
            </div>
          </div>

          {/* Desktop Menu */}
          {!isMobile && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                flex: '0 1 auto',
                justifyContent: 'center', 
                marginLeft: '12px', 
                marginRight: '12px',
                minWidth: 0,
                maxWidth: '600px',
              }}
            >
              <Menu
                mode="horizontal"
                items={menuItems}
                style={{
                  border: 'none',
                  background: 'transparent',
                  lineHeight: '64px',
                }}
              />
            </div>
          )}

          {/* Desktop Action Buttons */}
          {!isMobile && (
            <div 
              style={{ 
                display: 'flex', 
                gap: '8px', 
                flexShrink: 0,
                minWidth: 'fit-content',
              }}
            >
              <Button 
                type="default" 
                icon={<UserOutlined />}
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                Sign In
              </Button>
              <Button
                type="primary"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: '20px' }} />}
              onClick={showDrawer}
              style={{
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        size="default"
        styles={{
          body: {
            padding: '16px',
          },
        }}
      >
        <Menu
          mode="vertical"
          items={menuItems}
          style={{ 
            border: 'none',
            marginBottom: '16px',
          }}
          onClick={closeDrawer}
        />
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button 
            type="default" 
            icon={<UserOutlined />} 
            block
            size="large"
          >
            Sign In
          </Button>
          <Button
            type="primary"
            block
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderColor: 'transparent',
            }}
          >
            Get Started
          </Button>
        </div>
      </Drawer>
    </Header>
  );
};

export default Navbar;
