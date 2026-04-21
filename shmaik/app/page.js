'use client';

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeGrid from './components/HomeGrid';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';

export default function Page() {
  const [activePage, setActivePage] = useState('home');

  function navigate(page) {
    setActivePage(page);
    window.scrollTo(0, 0);
  }

  return (
    <>
      <Header activePage={activePage} onNavigate={navigate} />

      {activePage === 'home' && <HomeGrid />}
      {activePage === 'about' && <AboutPage />}
      {activePage === 'contact' && <ContactPage />}

      <Footer />
    </>
  );
}
