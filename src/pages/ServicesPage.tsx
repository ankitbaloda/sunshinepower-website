import React from 'react';
import { CheckCircle, ArrowRight, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import { COMPANY_INFO } from '../utils/constants';

const ServicesPage: React.FC = () => {
  const services = [
    {
      title: 'Rooftop Solar Installation',
      description: 'Complete end-to-end solar system installation for homes and businesses with premium components and professional expertise.',
      features: [
        'Free site survey and energy audit',
        'Custom system design and engineering',
        'High-efficiency solar panels and inverters',
        'Professional installation with safety protocols',
        'Grid connection and net metering setup',
        'Complete documentation and warranties',
        '25-year performance guarantee'
      ],
      image: 'https://images.pexels.com/photos/9875435/pexels-photo-9875435.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      pricing: 'Starting from ₹65,000/kW'
    },
    {
      title: 'Expert Solar Consultation',
      description: 'Professional technical consultation to help you make informed decisions about your solar investment.',
      features: [
        'Detailed energy consumption analysis',
        'Roof assessment and feasibility study',
        'System sizing recommendations',
        'Financial modeling and ROI calculation',
        'Technology selection guidance',
        'Regulatory compliance advice',
        'Ongoing technical support'
      ],
      image: 'https://images.pexels.com/photos/8837717/pexels-photo-8837717.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      pricing: 'Free for installations'
    },
    {
      title: 'Maintenance & Repair Services',
      description: 'Comprehensive maintenance packages to ensure your solar system operates at peak efficiency throughout its lifetime.',
      features: [
        'Regular cleaning and inspection',
        'Performance monitoring and analytics',
        'Preventive maintenance protocols',
        'Quick diagnosis and repairs',
        'Component replacement when needed',
        'System optimization and upgrades',
        '24/7 emergency support'
      ],
      image: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      pricing: 'AMC from ₹2,500/year'
    },
    {
      title: 'Government Subsidy Assistance',
      description: 'Complete assistance with government subsidy applications to maximize your savings on solar installation.',
      features: [
        'Subsidy eligibility assessment',
        'Complete documentation preparation',
        'Application submission and tracking',
        'Liaison with government departments',
        'Approval follow-up and expediting',
        'Subsidy disbursement assistance',
        'Maximum benefit optimization'
      ],
      image: 'https://images.pexels.com/photos/7078662/pexels-photo-7078662.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      pricing: 'Included in installation'
    }
  ];

  return (
    <>
      <SEO 
        title="Solar Services - Installation, Maintenance & Consultation"
        description="Comprehensive solar services in Jaipur: installation, maintenance, consultation, and government subsidy assistance. Professional solar solutions with warranties."
        canonical="https://sunshinepower.net.in/services"
      />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-[#E6F2FF] to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-[#173B63] mb-6">
                Our Solar Services
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                From initial consultation to long-term maintenance, we provide comprehensive solar solutions 
                tailored to your energy needs and budget.
              </p>
            </div>
          </div>
        </section>

        {/* Services Detail */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-20">
              {services.map((service, index) => (
                <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}>
                  <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                    <div className="relative">
                      <img 
                        src={service.image}
                        alt={service.title}
                        className="rounded-2xl shadow-2xl w-full"
                      />
                      <div className="absolute -bottom-6 -right-6 bg-[#F7C948] text-[#173B63] p-4 rounded-2xl shadow-lg">
                        <p className="font-bold text-lg">{service.pricing}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-6">
                      {service.title}
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <a
                        href={`tel:+91${COMPANY_INFO.phone}`}
                        className="bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors duration-200"
                      >
                        <Phone size={20} />
                        <span>Get Quote</span>
                      </a>
                      <button className="border border-[#173B63] text-[#173B63] hover:bg-[#173B63] hover:text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors duration-200">
                        <span>Learn More</span>
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-[#173B63] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">
                Why Choose Sunshine Power?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-left p-6 bg-white/10 rounded-2xl">
                  <h3 className="text-xl font-bold text-[#F7C948] mb-4">Certified Expertise</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our team holds industry certifications and follows international installation standards 
                    to ensure the highest quality workmanship.
                  </p>
                </div>

                <div className="text-left p-6 bg-white/10 rounded-2xl">
                  <h3 className="text-xl font-bold text-[#F7C948] mb-4">Local Knowledge</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Deep understanding of Rajasthan's climate, regulations, and subsidy programs 
                    ensures optimal system performance and maximum savings.
                  </p>
                </div>

                <div className="text-left p-6 bg-white/10 rounded-2xl">
                  <h3 className="text-xl font-bold text-[#F7C948] mb-4">Premium Components</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We partner with leading manufacturers to provide tier-1 solar panels, 
                    inverters, and components with comprehensive warranties.
                  </p>
                </div>

                <div className="text-left p-6 bg-white/10 rounded-2xl">
                  <h3 className="text-xl font-bold text-[#F7C948] mb-4">Lifetime Support</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our relationship doesn't end at installation. We provide ongoing support, 
                    maintenance, and monitoring for the life of your system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ServicesPage;