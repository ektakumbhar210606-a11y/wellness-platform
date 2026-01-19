import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
}
