import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import Footer from './components/Footer';
import AuthGuard from './components/AuthGuard';

export default function Home() {
  return (
    <AuthGuard redirectToDashboard={true}>
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <ServicesSection />
        <HowItWorksSection />
        <Footer />
      </div>
    </AuthGuard>
  );
}
