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
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <circle cx="20" cy="12" r="8" fill="#F7C948" />
                  <path d="M20 2 L20 6 M30 12 L26 12 M28 6 L25 9 M12 6 L15 9 M10 12 L14 12 M12 18 L15 15 M28 18 L25 15" 
                        stroke="#F7C948" strokeWidth="2" strokeLinecap="round" />
                  <rect x="8" y="22" width="24" height="16" rx="2" fill="#F7C948" />
                  <g stroke="#173B63" strokeWidth="1">
                    <line x1="14" y1="22" x2="14" y2="38" />
                    <line x1="20" y1="22" x2="20" y2="38" />
                    <line x1="26" y1="22" x2="26" y2="38" />
                    <line x1="8" y1="28" x2="21" y2="28" />
                    <line x1="8" y1="32" x2="21" y2="32" />
                  </g>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F7C948]">SUNSHINE POWER</h3>
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
                <span className="text-sm">Mon-Sat: 9AM-6PM</span>
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