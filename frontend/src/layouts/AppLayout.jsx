import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import TopNav from '../components/TopNav.jsx';
import PageFallback from '../components/PageFallback.jsx';
import Footer from '../components/Footer.jsx';

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="app-shell__main">
        <TopNav onMenuClick={() => setMobileNavOpen(true)} />
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<PageFallback inline />}>
            <Outlet />
          </Suspense>
        </main>
          <Footer />
      </div>
    </div>
  );
}
