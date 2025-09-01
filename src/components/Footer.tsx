import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';
import { COMPANY_INFO } from '../utils/constants';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#173B63] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              {/* Crop visual whitespace around logo using a fixed-height overflow-hidden wrapper */}
              <div className="w-36 h-12 overflow-hidden rounded">
                <img
                  src="/Complete-Logo.jpg"
                  alt="Sunshine Power"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {COMPANY_INFO.description} Trusted by 500+ customers across Rajasthan for reliable solar solutions.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-[#F7C948]" />
                <a href={`tel:+91${COMPANY_INFO.phone}`} className="hover:text-[#F7C948] transition-colors">
                  +91 {COMPANY_INFO.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-[#F7C948]" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-[#F7C948] transition-colors">
                  {COMPANY_INFO.email}
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-[#F7C948] mt-1" />
                <div className="text-gray-300">
                  <p>{COMPANY_INFO.address.street}</p>
                  <p>{COMPANY_INFO.address.city}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.pincode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-[#F7C948] mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'services', label: 'Services' },
                { id: 'about', label: 'About Us' },
                { id: 'contact', label: 'Contact' }
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onNavigate(link.id)}
                    className="text-gray-300 hover:text-[#F7C948] transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold text-[#F7C948] mb-6">Our Services</h4>
            <ul className="space-y-3">
              {COMPANY_INFO.services.map((service) => (
                <li key={service}>
                  <span className="text-gray-300">{service}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h5 className="text-sm font-semibold text-[#F7C948] mb-3">Business Hours</h5>
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock size={14} />
                <span className="text-sm">All Days: 8AM-8PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm mb-4 md:mb-0">
              © {currentYear} {COMPANY_INFO.name}. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-[#F7C948] transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-300 hover:text-[#F7C948] transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-gray-300 hover:text-[#F7C948] transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;