import React from 'react';
import { ArrowRight } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      id: 'installation',
      title: 'Solar Installation',
      description: 'Complete rooftop solar system design and installation with high-quality components and warranty.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#F7C948]">
          <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" />
          <g stroke="#173B63" strokeWidth="1" fill="none">
            <line x1="7" y1="6" x2="7" y2="18" />
            <line x1="12" y1="6" x2="12" y2="18" />
            <line x1="17" y1="6" x2="17" y2="18" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="3" y1="14" x2="21" y2="14" />
          </g>
        </svg>
      ),
      features: ['Site Survey & Design', 'Quality Components', '25-Year Warranty', 'Grid Connection']
    },
    {
      id: 'consultation',
      title: 'Expert Consultation',
      description: 'Free technical consultation to determine the best solar solution for your energy needs and budget.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#F7C948]">
          <circle cx="12" cy="8" r="5" fill="currentColor" />
          <path d="M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" fill="currentColor" />
        </svg>
      ),
      features: ['Energy Audit', 'System Sizing', 'ROI Analysis', 'Technical Guidance']
    },
    {
      id: 'maintenance',
      title: 'Maintenance & Repairs',
      description: 'Comprehensive maintenance services to ensure optimal performance and maximum energy generation.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#F7C948]">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor" />
        </svg>
      ),
      features: ['Regular Cleaning', 'Performance Monitoring', 'Quick Repairs', 'AMC Packages']
    },
    {
      id: 'subsidy',
      title: 'Govt Subsidy Assistance',
      description: 'Complete assistance with government subsidy applications and documentation for maximum savings.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#F7C948]">
          <path d="M3 21h18M5 21V7l8-6 8 6v14M9 9v6M15 9v6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      features: ['Subsidy Application', 'Documentation Help', 'Approval Follow-up', 'Maximum Benefits']
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#173B63] mb-6">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From consultation to installation and maintenance, we provide end-to-end solar solutions for your home and business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="bg-[#E6F2FF] w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#173B63] transition-colors duration-300">
                <div className="group-hover:text-[#F7C948] transition-colors duration-300">
                  {service.icon}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#173B63] mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>

              <ul className="space-y-2 mb-6">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-[#F7C948] rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="flex items-center text-[#173B63] font-semibold group-hover:text-[#F7C948] transition-colors duration-300">
                Learn More
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;