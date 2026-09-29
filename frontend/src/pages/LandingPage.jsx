import { useEffect } from 'react';
import { SiteHeader, SiteFooter } from './landing/SiteChrome.jsx';
import Hero from './landing/Hero.jsx';
import { HowItWorks, Features, Teams, Faq, FinalCta } from './landing/Sections.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import '../styles/landing.css';

export default function LandingPage() {
  usePageTitle('');

  // Landing anchors scroll under a sticky header; land on a hash target correctly on first load.
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Features />
        <Teams />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
