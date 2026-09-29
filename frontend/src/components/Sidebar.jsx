import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { IconLayoutDashboard, IconFolder, IconGitPullRequest, IconChartBar, IconSettings, IconX } from '@tabler/icons-react';
import { m } from './Motion.jsx';
import Logo from './Logo.jsx';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { transitions } from '../utils/motionTokens.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { to: '/repositories', label: 'Repositories', Icon: IconFolder },
  { to: '/reviews', label: 'Reviews', Icon: IconGitPullRequest },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

function SidebarContent({ onNavigate, onClose, firstFocusRef }) {
  return (
    <>
      <div className="sidebar__brand">
        <Link to="/dashboard" onClick={onNavigate} aria-label="DevMind — go to dashboard" className="logo-link">
          <Logo />
        </Link>
        {onClose && (
          <button ref={firstFocusRef} type="button" onClick={onClose} aria-label="Close menu" className="icon-btn">
            <IconX size={18} />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}>
            <Icon size={18} stroke={1.75} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }) {
  const isMobile = useIsMobile();
  const closeRef = useRef(null);

  // Drawer behaviour on small screens: Escape closes, focus moves into it.
  useEffect(() => {
    if (!isMobile || !mobileOpen) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobile, mobileOpen, onClose]);

  if (!isMobile) {
    return (
      <aside className="sidebar">
        <SidebarContent />
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <m.div
            className="sidebar__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.micro}
            onClick={onClose}
          />
          <m.aside
            className="sidebar sidebar--drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={transitions.base}
            aria-label="Navigation menu"
          >
            <SidebarContent onNavigate={onClose} onClose={onClose} firstFocusRef={closeRef} />
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
}
