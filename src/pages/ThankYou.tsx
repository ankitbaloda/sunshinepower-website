import React, { useEffect } from 'react';
import { CheckCircle, Phone, Home, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { COMPANY_INFO } from '../utils/constants';

interface ThankYouProps {
  onNavigate: (page: string) => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ onNavigate }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO 
        title="Thank You - We'll Contact You Soon"
        description="Thank you for your interest in solar power. Our team will contact you within 24 hours with a personalized solar proposal."
        canonical="https://sunshinepower.net.in/thank-you"
      />

      <div className="pt-20 min-h-screen bg-gradient-to-br from-[#E6F2FF] to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Success Icon */}
            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle size={48} className="text-green-600" />
            </div>

            {/* Main Message */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#173B63] mb-6">
              Thank You!
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We've received your inquiry and our solar experts will contact you within 
              <strong className="text-[#173B63]"> 24 hours </strong>
              with a personalized consultation and detailed proposal.
            </p>

            {/* What Happens Next */}
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-12">
              <h2 className="text-2xl font-bold text-[#173B63] mb-6">What Happens Next?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#F7C948] w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#173B63] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#173B63] mb-2">Expert Call</h3>
                    <p className="text-gray-600 text-sm">Our solar consultant will call you to understand your specific requirements.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#F7C948] w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#173B63] font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#173B63] mb-2">Site Survey</h3>
                    <p className="text-gray-600 text-sm">We'll schedule a free site survey to assess your rooftop and energy needs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#F7C948] w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#173B63] font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#173B63] mb-2">Custom Proposal</h3>
                    <p className="text-gray-600 text-sm">Receive a detailed proposal with system design, pricing, and savings projection.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Immediate Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <a
                href={`tel:+91${COMPANY_INFO.phone}`}
                className="bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] p-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg"
              >
                <Phone size={20} />
                <span>Call Now</span>
              </a>

              <a
                href={COMPANY_INFO.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg"
              >
                <MessageCircle size={20} />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => onNavigate('home')}
                className="bg-[#173B63] hover:bg-[#173B63]/90 text-white p-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg"
              >
                <Home size={20} />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-[#173B63] mb-4">In the Meantime...</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-semibold text-[#173B63] mb-2">Prepare for Your Consultation</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Have your recent electricity bills ready</li>
                    <li>• Check your rooftop accessibility</li>
                    <li>• Think about your energy goals</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#173B63] mb-2">Follow Us</h4>
                  <p className="text-gray-600 text-sm">
                    Stay updated with the latest solar news, government policies, and customer success stories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;