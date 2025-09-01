import React from 'react';
import ContactForm from '../components/ContactForm';
import SEO from '../components/SEO';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { COMPANY_INFO } from '../utils/constants';

interface ContactProps {
  onNavigate: (page: string) => void;
}

const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  return (
    <>
      <SEO 
        title="Contact Us - Free Solar Consultation in Jaipur"
        description="Contact Sunshine Power for free solar consultation in Jaipur. Call +917734860701 or fill our form for expert advice on rooftop solar installation."
        canonical="https://sunshinepower.net.in/contact"
      />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-[#E6F2FF] to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-[#173B63] mb-6">
                Contact Us
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Ready to start your solar journey? Get in touch with our experts for a free consultation 
                and personalized solar solution.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Contact Actions */}
        <section className="py-12 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a
                  href={`tel:+91${COMPANY_INFO.phone}`}
                  className="bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] p-6 rounded-2xl flex items-center space-x-4 transition-all duration-300 hover:shadow-lg group"
                >
                  <Phone size={32} className="group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="font-bold text-lg">Call Now</p>
                    <p className="text-sm">+91 {COMPANY_INFO.phone}</p>
                  </div>
                </a>

                <a
                  href={COMPANY_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl flex items-center space-x-4 transition-all duration-300 hover:shadow-lg group"
                >
                  <MessageCircle size={32} className="group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="font-bold text-lg">WhatsApp</p>
                    <p className="text-sm">Quick Response</p>
                  </div>
                </a>

                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="bg-[#173B63] hover:bg-[#173B63]/90 text-white p-6 rounded-2xl flex items-center space-x-4 transition-all duration-300 hover:shadow-lg group"
                >
                  <Mail size={32} className="group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="font-bold text-lg">Email Us</p>
                    <p className="text-sm">Detailed Inquiry</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactForm onNavigate={onNavigate} />

        {/* Office Location */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-8">
                    Visit Our Office
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <MapPin className="text-[#F7C948] mt-1" size={24} />
                      <div>
                        <h3 className="font-bold text-[#173B63] mb-2">Address</h3>
                        <p className="text-gray-600 leading-relaxed">
                          {COMPANY_INFO.address.street}<br />
                          {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <Clock className="text-[#F7C948] mt-1" size={24} />
                      <div>
                        <h3 className="font-bold text-[#173B63] mb-2">Business Hours</h3>
                        <div className="text-gray-600">
                          <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                          <p>Sunday: Closed</p>
                          <p className="text-sm text-green-600 mt-2">Emergency support available 24/7</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#E6F2FF] p-6 rounded-xl border-l-4 border-[#F7C948]">
                      <h3 className="font-bold text-[#173B63] mb-2">Service Area</h3>
                      <p className="text-gray-700">
                        We provide solar installation services across Jaipur and surrounding areas including 
                        Ajmer, Tonk, Dausa, and other nearby districts in Rajasthan.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Google Maps Placeholder */}
                  <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MapPin size={48} className="mx-auto mb-4" />
                      <p className="text-lg font-semibold">Interactive Map</p>
                      <p>Google Maps integration would be added here</p>
                      <p className="text-sm mt-2">
                        Latitude: {COMPANY_INFO.coordinates.lat}<br />
                        Longitude: {COMPANY_INFO.coordinates.lng}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#173B63] mb-12 text-center">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    question: 'How much does a rooftop solar system cost in Jaipur?',
                    answer: 'The cost ranges from ₹50,000 to ₹80,000 per kW depending on components and installation complexity. Government subsidies can reduce this cost by up to 40%.'
                  },
                  {
                    question: 'What government subsidies are available?',
                    answer: 'The central government provides ₹14,588 per kW for systems up to 3kW and ₹7,294 per kW for additional capacity up to 10kW. We handle all subsidy paperwork for you.'
                  },
                  {
                    question: 'How long does installation take?',
                    answer: 'Installation typically takes 1-3 days depending on system size. The complete process from survey to grid connection usually takes 2-4 weeks including approvals.'
                  },
                  {
                    question: 'What maintenance is required?',
                    answer: 'Solar panels require minimal maintenance - mainly periodic cleaning and annual inspection. We offer comprehensive AMC packages starting from ₹2,500 per year.'
                  },
                  {
                    question: 'What is the typical payback period?',
                    answer: 'With excellent sunlight in Jaipur, solar systems typically pay for themselves in 4-6 years. After that, you enjoy 20+ years of free electricity.'
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[#173B63] mb-3">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;