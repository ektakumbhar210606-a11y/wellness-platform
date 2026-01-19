'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import Footer from './components/Footer';

export default function Home() {
  const searchParams = useSearchParams();
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for reset token in query parameters
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, [searchParams]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar resetToken={resetToken} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ServicesSection />
      <Footer />
    </div>
  );
}
