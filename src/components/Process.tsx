import React from 'react';
import { Search, FileText, Wrench, Headphones } from 'lucide-react';

const Process: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: 'Site Survey',
      description: 'Our experts visit your property to assess roof condition, sunlight exposure, and energy requirements.',
      icon: Search,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2, 
      title: 'Custom Proposal',
      description: 'We design a tailored solar system with detailed quotation, savings projection, and subsidy benefits.',
      icon: FileText,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      title: 'Professional Installation',
      description: 'Certified technicians install your system with minimal disruption and complete safety protocols.',
      icon: Wrench,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 4,
      title: 'Ongoing Support',
      description: 'We provide maintenance, monitoring, and support to ensure optimal performance for decades.',
      icon: Headphones,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#E6F2FF] to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#173B63] mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our streamlined process ensures a smooth journey from consultation to clean energy independence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-[#F7C948] to-transparent z-0"></div>
              )}
              
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${step.color}`}>
                  <step.icon size={32} />
                </div>
                
                <div className="mb-4">
                  <span className="bg-[#F7C948] text-[#173B63] px-3 py-1 rounded-full text-sm font-bold">
                    Step {step.id}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#173B63] mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline for Mobile */}
        <div className="lg:hidden mt-12">
          <div className="flex flex-col space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-[#F7C948] rounded-full flex items-center justify-center text-[#173B63] font-bold text-sm">
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-[#F7C948] to-gray-200 ml-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;