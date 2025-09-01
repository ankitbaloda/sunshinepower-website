import React from 'react';
import { Phone, MessageCircle, Home, Grid3X3, Info, Mail } from 'lucide-react';
import { COMPANY_INFO } from '../utils/constants';

interface MobileDockProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const MobileDock: React.FC<MobileDockProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: Grid3X3 },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: Mail }
  ];

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col space-y-3 md:hidden">
        <a
          href={`tel:+91${COMPANY_INFO.phone}`}
          className="bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Call Now"
        >
          <Phone size={24} />
        </a>
        
        <a
          href={COMPANY_INFO.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="WhatsApp"
        >
          <MessageCircle size={24} />
        </a>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-3 px-2 transition-colors duration-200 ${
                currentPage === item.id
                  ? 'text-[#173B63] bg-[#E6F2FF]'
                  : 'text-gray-500 hover:text-[#173B63]'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileDock;