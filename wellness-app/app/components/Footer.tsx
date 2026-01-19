'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
    services: [
      { label: 'Massage Therapy', href: '/massage-therapy' },
      { label: 'Spa Services', href: '/spa-services' },
      { label: 'Wellness Programs', href: '/wellness-programs' },
      { label: 'Corporate Wellness', href: '/corporate-wellness' },
    ],
    support: [
      { label: 'Help Center', href: '/help-center' },
      { label: 'Safety', href: '/safety' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  };



  return (
    <footer
      id="footer-section"
      className="footer-container"
    >
      <div className="footer-content-wrapper">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-column">
            <div className="brand-info">
              <div className="brand-name">🧘‍♀️ Serenity</div>
              <p className="brand-description">
                Connecting wellness seekers with certified professionals for a healthier, more balanced life.
              </p>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <span>info@serenity.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="footer-column">
            <h5 className="column-title">Company</h5>
            <ul className="link-list">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="footer-column">
            <h5 className="column-title">Services</h5>
            <ul className="link-list">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-column">
            <h5 className="column-title">Support</h5>
            <ul className="link-list">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="copyright-text">
            © {currentYear} Serenity. All rights reserved.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .footer-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 60px 0 24px;
        }
        
        .footer-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        @media (max-width: 768px) {
          .footer-content-wrapper {
            padding: 0 16px;
          }
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }
        
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        
        .footer-column {
          display: flex;
          flex-direction: column;
        }
        
        .brand-name {
          font-size: 24px;
          font-weight: bold;
          color: white;
          margin-bottom: 12px;
        }
        
        .brand-description {
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 20px 0;
          line-height: 1.6;
        }
        
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.85);
        }
        
        .contact-icon {
          font-size: 14px;
        }
        
        .column-title {
          color: white;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .link-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .link-list li {
          margin-bottom: 12px;
        }
        
        .link-list li:last-child {
          margin-bottom: 0;
        }
        
        .footer-link {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition: opacity 0.3s ease;
        }
        
        .footer-link:hover {
          opacity: 0.8;
        }
        
        .divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.2);
          margin: 40px 0 24px;
        }
        
        .footer-bottom {
          text-align: center;
        }
        
        .copyright-text {
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
