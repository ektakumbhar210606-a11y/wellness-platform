'use client';

import React, { useState, useEffect } from 'react';
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
  const [activeSection, setActiveSection] = useState('');
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
    // If we're already on the home page, scroll directly
    if (pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } else {
      // If we're on a different page, navigate to home first, then scroll
      router.push('/');
      // Store the target section in sessionStorage so we can scroll after navigation
      sessionStorage.setItem('scrollToSection', sectionId);
    }
  };

  // Function to determine which section is currently in view
  const getCurrentSection = () => {
    const sections = ['hero-section', 'features-section', 'services-section', 'how-it-works-section', 'footer-section'];
    const scrollPosition = window.scrollY + 100; // Add offset to account for navbar height

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const { offsetTop, offsetHeight } = element;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          return sectionId;
        }
      }
    }
    
    // Check for special case where we're at the very bottom of the page
    const footerElement = document.getElementById('footer-section');
    if (footerElement && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50) {
      return 'footer-section';
    }
    
    return '';
  };

  // Handle scrolling after navigation to home page
  useEffect(() => {
    if (pathname === '/') {
      const targetSection = sessionStorage.getItem('scrollToSection');
      if (targetSection) {
        // Wait for the page to fully load
        const timer = setTimeout(() => {
          const element = document.getElementById(targetSection);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
          // Clear the stored section after scrolling
          sessionStorage.removeItem('scrollToSection');
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [pathname]);

  // Set up scroll event listener to track active section
  useEffect(() => {
    if (pathname !== '/') {
      // Only set up scroll listener on homepage
      return;
    }
    
    const handleScroll = () => {
      const currentSection = getCurrentSection();
      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };
    
    // Initial check in case the page loads scrolled
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, activeSection]);

  const isProvider = user && (user.role?.toLowerCase() === 'provider' || user.role?.toLowerCase() === 'business');
  const hasBusiness = user && user.businessId;
  const showProviderDashboard = isProvider && hasBusiness;
  
  const isTherapist = user && user.role?.toLowerCase() === 'therapist';
  const showTherapistDashboard = isTherapist;

  const isCustomer = user && user.role?.toLowerCase() === 'customer';
  const showCustomerDashboard = isCustomer;



  const menuItems: MenuItem[] = [
    {
      key: 'hero-section',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('hero-section');
      }}>Home</Link>,
    },
    {
      key: 'features-section',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('features-section');
      }}>Features</Link>,
    },
    {
      key: 'services-section',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('services-section');
      }}>Services</Link>,
    },
    {
      key: 'how-it-works-section',
      label: <Link href="/" onClick={(e) => {
        e.preventDefault();
        scrollToSection('how-it-works-section');
      }}>How It Works</Link>,
    },
    {
      key: 'footer-section',
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
                selectedKeys={[activeSection]}
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
              {showCustomerDashboard && (
                <Button 
                  type="primary" 
                  icon={<UserOutlined />}
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => router.push('/dashboard/customer')}
                >
                  Customer Dashboard
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
          selectedKeys={[activeSection]}
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
          {showCustomerDashboard && (
            <Button 
              type="primary" 
              icon={<UserOutlined />} 
              block
              size="large"
              onClick={() => router.push('/dashboard/customer')}
            >
              Customer Dashboard
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
