'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Grid } from 'antd';
import { MenuOutlined, UserOutlined, TeamOutlined, ShopOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AuthModal from './AuthModal';
import { useAuth } from '@/app/context/AuthContext';

const { Header } = Layout;
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

const Navbar: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'roleSelection'>('login');
  const { isAuthenticated, logout } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Effect to handle custom events from other components
  React.useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const customEvent = event as CustomEvent;
      const view = customEvent.detail?.view || 'roleSelection';
      openAuthModal(view);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works-section');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: 'home',
      label: 'Home',
      onClick: scrollToTop,
    },
    {
      key: 'services',
      label: 'Services',
      onClick: scrollToServices,
    },
    {
      key: 'how-it-works',
      label: 'How It Works',
      onClick: scrollToHowItWorks,
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

  const openAuthModal = (view: 'login' | 'register' | 'roleSelection' = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = () => {
    // Handle any post-authentication actions here
    closeAuthModal();
  };

  return (
    <>
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
              {!isAuthenticated ? (
                <Button 
                  type="default" 
                  icon={<UserOutlined />}
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </Button>
              ) : (
                <Button 
                  type="default" 
                  icon={<UserOutlined />}
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  onClick={logout}
                >
                  Logout
                </Button>
              )}
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
          items={menuItems.map(item => {
            if (item && item.key === 'home') {
              return {
                ...item,
                onClick: () => {
                  scrollToTop();
                  closeDrawer();
                }
              };
            }
            if (item && item.key === 'services') {
              return {
                ...item,
                onClick: () => {
                  scrollToServices();
                  closeDrawer();
                }
              };
            }
            if (item && item.key === 'how-it-works') {
              return {
                ...item,
                onClick: () => {
                  scrollToHowItWorks();
                  closeDrawer();
                }
              };
            }
            return item;
          })}
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
          {!isAuthenticated ? (
            <Button 
              type="default" 
              icon={<UserOutlined />} 
              block
              size="large"
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </Button>
          ) : (
            <Button 
              type="default" 
              icon={<UserOutlined />} 
              block
              size="large"
              onClick={logout}
            >
              Logout
            </Button>
          )}
        </div>
      </Drawer>
    </Header>
      <AuthModal 
        open={authModalOpen}
        onCancel={closeAuthModal}
        onSuccess={handleAuthSuccess}
        initialView={authModalView}
      />
    </>
  );
};

export default Navbar;
