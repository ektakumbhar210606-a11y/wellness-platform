'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import ResetPasswordModal from './auth/ResetPasswordModal';
import { useAuth } from '@/app/context/AuthContext';
import styles from './Navbar.module.css';

interface NavbarProps {
  resetToken?: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ resetToken }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { isAuthenticated, isHydrated, logout, user, login, authModalOpen, authModalView, openAuthModal, closeAuthModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Remove the custom event listener effect since we're using context now
  // The openAuthModal function from context will handle opening the modal

  // State for reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Effect to handle reset token from query parameters
  React.useEffect(() => {
    if (resetToken) {
      // Open reset password modal
      setResetModalOpen(true);
    }
  }, [resetToken]);

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
  const isTherapist = user && user.role?.toLowerCase() === 'therapist';
  
  // Don't show dashboard button for providers and therapists
  const showProviderDashboard = false;
  const showTherapistDashboard = false;

  const isCustomer = user && user.role?.toLowerCase() === 'customer';
  const showCustomerDashboard = isCustomer;

  const navItems = [
    { key: 'hero-section', label: 'Home', section: 'hero-section' },
    { key: 'features-section', label: 'Features', section: 'features-section' },
    { key: 'services-section', label: 'Services', section: 'services-section' },
    { key: 'how-it-works-section', label: 'How It Works', section: 'how-it-works-section' },
  ];
  
  const staticPages = [
    { key: 'about-us', label: 'About Us', href: '/about-us' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Note: openAuthModal and closeAuthModal are now provided by the AuthContext
  // We don't need local implementations anymore

  const handleAuthSuccess = () => {
    closeAuthModal();
  };

  const handleNavClick = (sectionId: string) => {
    // Prevent providers and therapists from accessing landing page sections
    if ((isProvider || isTherapist) && isAuthenticated) {
      return;
    }
    scrollToSection(sectionId);
    closeMobileMenu();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    closeMobileMenu();
  };

  const handleDashboardClick = (dashboardPath: string) => {
    router.push(dashboardPath);
    closeMobileMenu();
  };

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <div className={styles.logo}>
            🧘‍♀️ Serenity
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.DesktopNav}>
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.key} className={styles.navItem}>
                  <Link 
                    href="/" 
                    className={`${styles.navLink} ${activeSection === item.section ? styles.active : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.section);
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {staticPages.map((page) => (
                <li key={page.key} className={styles.navItem}>
                  <Link 
                    href={page.href}
                    className={styles.navLink}
                    onClick={() => {
                      // Prevent providers and therapists from accessing static pages
                      if ((isProvider || isTherapist) && isAuthenticated) {
                        return;
                      }
                      router.push(page.href);
                    }}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Action Buttons */}
          <div className={styles.desktopActions}>
            {!isHydrated ? (
              // Show loading state while authentication state is initializing
              <div className={styles.authButton} style={{ width: '80px', height: '32px', backgroundColor: '#f0f0f0' }}></div>
            ) : !isAuthenticated ? (
              <button 
                className={styles.authButton}
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </button>
            ) : (
              <>
                <button 
                  className={styles.authButton}
                  onClick={handleLogout}
                >
                  Logout
                </button>
                {showCustomerDashboard && (
                  <button 
                    className={`${styles.authButton} ${styles.primaryButton}`}
                    onClick={() => handleDashboardClick('/dashboard/customer')}
                  >
                    Dashboard
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <div className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.open : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.logo}>
            🧘‍♀️ Serenity
          </div>
          <button 
            className={styles.closeButton}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <ul className={styles.mobileNavList}>
          {navItems.map((item) => (
            <li key={item.key} className={styles.mobileNavItem}>
              <Link 
                href="/" 
                className={`${styles.mobileNavLink} ${activeSection === item.section ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.section);
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {staticPages.map((page) => (
            <li key={page.key} className={styles.mobileNavItem}>
              <Link 
                href={page.href}
                className={styles.mobileNavLink}
                onClick={() => {
                  // Prevent providers and therapists from accessing static pages
                  if ((isProvider || isTherapist) && isAuthenticated) {
                    return;
                  }
                  router.push(page.href);
                  closeMobileMenu();
                }}
              >
                {page.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.mobileActions}>
          <ul className={styles.mobileActionsList}>
            {!isHydrated ? (
              // Show loading state while authentication state is initializing
              <li>
                <div className={styles.mobileActionButton} style={{ width: '100%', height: '40px', backgroundColor: '#f0f0f0' }}></div>
              </li>
            ) : !isAuthenticated ? (
              <li>
                <button 
                  className={styles.mobileActionButton}
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </button>
              </li>
            ) : (
              <>
                <li>
                  <button 
                    className={styles.mobileActionButton}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
                {showCustomerDashboard && (
                  <li>
                    <button 
                      className={`${styles.mobileActionButton} ${styles.mobilePrimaryButton}`}
                      onClick={() => handleDashboardClick('/dashboard/customer')}
                    >
                      Dashboard
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>

      <AuthModal 
        open={authModalOpen}
        onCancel={closeAuthModal}
        onSuccess={handleAuthSuccess}
        initialView={authModalView}
      />
      <ResetPasswordModal 
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        token={resetToken || ''}
        onResetSuccess={() => setResetModalOpen(false)}
      />
    </>
  );
};

export default Navbar;