import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MobileDock from './components/MobileDock';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import ServicesPage from './pages/ServicesPage';
import Contact from './pages/Contact';
import ThankYou from './pages/ThankYou';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      const page = path === '/' ? 'home' : path.slice(1);
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState(null, '', path);
    window.scrollTo(0, 0);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'about':
        return <About />;
      case 'services':
        return <ServicesPage />;
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'thank-you':
        return <ThankYou onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main className="pb-16 md:pb-0">
        {renderCurrentPage()}
      </main>
      
      <Footer onNavigate={handleNavigate} />
      <MobileDock currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;