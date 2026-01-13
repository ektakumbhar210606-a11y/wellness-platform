'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Grid } from 'antd';
import { MenuOutlined, UserOutlined, TeamOutlined, ShopOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  const { isAuthenticated, logout, user, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Check if provider has businessId and fetch if missing
  React.useEffect(() => {
    const checkAndFetchBusinessId = async () => {
      if (isAuthenticated && user && 
          (user.role?.toLowerCase() === 'provider' || user.role?.toLowerCase() === 'business') && 
          !user.businessId) {
        try {
          // Fetch business profile to get the business ID
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/my-business`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const businessData = await response.json();
            // Update user with businessId
            const updatedUser = {
              ...user,
              businessId: businessData.id
            };
            // Update context and localStorage
            login(updatedUser);
          }
        } catch (error) {
          console.error('Error fetching business ID:', error);
        }
      }
    };
    
    checkAndFetchBusinessId();
  }, [isAuthenticated, user, login]);

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

  const scrollToSection = (sectionId: string) => {
    // Check if we're already on the home page
    if (pathname === '/') {
      // Directly scroll to the section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } else {
      // Navigate to home page first, then scroll after a delay
      // Store the target section in a temporary location
      sessionStorage.setItem('scrollToSection', sectionId);
      router.push('/');
      
      // In case the useEffect on the home page doesn't catch it, also try with a timeout
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100); // Small delay to ensure page has loaded
    }
  };

  // Effect to handle scrolling when landing on the home page
  React.useEffect(() => {
    if (pathname === '/') {
      const sectionToScroll = sessionStorage.getItem('scrollToSection');
      if (sectionToScroll) {
        // Clear the stored value
        sessionStorage.removeItem('scrollToSection');
        // Wait a bit for the page to render, then scroll
        setTimeout(() => {
          const element = document.getElementById(sectionToScroll);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 50);
      }
    }
  }, [pathname]);

  const scrollToServices = () => {
    scrollToSection('services-section');
  };

  const isProvider = user && (user.role?.toLowerCase() === 'provider' || user.role?.toLowerCase() === 'business');
  const hasBusiness = user && user.businessId;
  const showProviderDashboard = isProvider && hasBusiness;
  
  const isTherapist = user && user.role?.toLowerCase() === 'therapist';
  const showTherapistDashboard = isTherapist;

  const scrollToHowItWorks = () => {
    scrollToSection('how-it-works-section');
  };

  const menuItems: MenuItem[] = [
    {
      key: 'home',
      label: <Link href="/" onClick={(e) => {
        if (pathname === '/') {
          e.preventDefault();
          scrollToSection('hero-section');
        }
      }}>Home</Link>,
    },
    {
      key: 'features',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('features-section');
      }}>Features</Link>,
    },
    {
      key: 'services',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('services-section');
      }}>Services</Link>,
    },
    {
      key: 'how-it-works',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('how-it-works-section');
      }}>How It Works</Link>,
    },
    {
      key: 'about',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('footer-section');
      }}>About Us</Link>,
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
              {showProviderDashboard && (
                <Button 
                  type="primary" 
                  icon={<ShopOutlined />}
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => router.push('/dashboard/provider')}
                >
                  Provider Dashboard
                </Button>
              )}
              {showTherapistDashboard && (
                <Button 
                  type="primary" 
                  icon={<TeamOutlined />}
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => router.push('/dashboard/therapist')}
                >
                  Therapist Dashboard
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
          items={menuItems}
          style={{ 
            border: 'none',
            marginBottom: '16px',
          }}
          onClick={(info) => {
            // Close drawer after a small delay to allow the scroll action to occur
            setTimeout(closeDrawer, 100);
          }}
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
          {showProviderDashboard && (
            <Button 
              type="primary" 
              icon={<ShopOutlined />} 
              block
              size="large"
              onClick={() => router.push('/dashboard/provider')}
            >
              Provider Dashboard
            </Button>
          )}
          {showTherapistDashboard && (
            <Button 
              type="primary" 
              icon={<TeamOutlined />} 
              block
              size="large"
              onClick={() => router.push('/dashboard/therapist')}
            >
              Therapist Dashboard
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
