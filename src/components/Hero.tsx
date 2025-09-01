import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { COMPANY_INFO } from '../utils/constants';

interface HeroProps {
  onGetConsultation: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetConsultation }) => {
  return (
    <section className="relative bg-gradient-to-br from-[#E6F2FF] via-[#E6F2FF] to-blue-50 pt-20 pb-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#173B63] rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#F7C948] rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#173B63] rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#173B63] mb-6 leading-tight">
            Harness the Sun.
            <br />
            <span className="text-[#173B63]">Power Your Future.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
            {COMPANY_INFO.description}
          </p>

          {/* Hero Image */}
          <div className="relative mb-8">
            <img 
              src="https://images.pexels.com/photos/9875435/pexels-photo-9875435.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
              alt="Solar panels installation on rooftop in Jaipur"
              className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetConsultation}
              className="bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>Get Free Consultation</span>
              <ArrowRight size={20} />
            </button>
            
            <a
              href={`tel:+91${COMPANY_INFO.phone}`}
              className="bg-[#173B63] hover:bg-[#173B63]/90 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Phone size={20} />
              <span>Call Now</span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-[#173B63]">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-[#173B63]">5MW+</div>
              <div className="text-gray-600">Solar Installed</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-[#173B63]">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;