import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Process from '../components/Process';
import ROICalculator from '../components/ROICalculator';
import ContactForm from '../components/ContactForm';
import SEO from '../components/SEO';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO 
        title="Rooftop Solar Installation in Jaipur"
        description="Leading solar power company in Jaipur. Get rooftop solar installation, maintenance, and government subsidy assistance. Free consultation available."
        canonical="https://sunshinepower.net.in"
      />
      
      <Hero onGetConsultation={scrollToContact} />
      <Services />
      <Process />
      <ROICalculator />
      <ContactForm onNavigate={onNavigate} />
    </>
  );
};

export default Home;