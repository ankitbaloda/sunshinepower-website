import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { COMPANY_INFO } from '../utils/constants';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavClick('home')}
          >
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                {/* Sun */}
                <circle cx="20" cy="12" r="8" fill="#F7C948" />
                <path d="M20 2 L20 6 M30 12 L26 12 M28 6 L25 9 M12 6 L15 9 M10 12 L14 12 M12 18 L15 15 M28 18 L25 15" 
                      stroke="#F7C948" strokeWidth="2" strokeLinecap="round" />
                {/* Solar Panel */}
                <rect x="8" y="22" width="24" height="16" rx="2" fill="#173B63" />
                <g stroke="#E6F2FF" strokeWidth="1">
                  <line x1="14" y1="22" x2="14" y2="38" />
                  <line x1="20" y1="22" x2="20" y2="38" />
                  <line x1="26" y1="22" x2="26" y2="38" />
                  <line x1="8" y1="28" x2="32" y2="28" />
                  <line x1="8" y1="32" x2="32" y2="32" />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#173B63]">SUNSHINE</h1>
              <p className="text-sm font-semibold text-[#173B63] -mt-1">POWER</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`font-medium transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'text-[#173B63] border-b-2 border-[#F7C948]'
                    : 'text-gray-600 hover:text-[#173B63]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={`tel:+91${COMPANY_INFO.phone}`}
              className="flex items-center space-x-2 bg-[#F7C948] hover:bg-[#F7C948]/90 text-[#173B63] px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              <Phone size={16} />
              <span>Call Now</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#173B63]"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="py-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`block w-full text-left px-4 py-3 transition-colors duration-200 ${
                    currentPage === item.id
                      ? 'text-[#173B63] bg-[#E6F2FF] border-r-4 border-[#F7C948]'
                      : 'text-gray-600 hover:text-[#173B63] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;