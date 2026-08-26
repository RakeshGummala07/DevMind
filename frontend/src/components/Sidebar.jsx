import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconLayoutDashboard, IconFolder, IconGitPullRequest, IconChartBar, IconX } from '@tabler/icons-react';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { transitions } from '../utils/motionTokens.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { to: '/repositories', label: 'Repositories', Icon: IconFolder },
  { to: '/reviews', label: 'Reviews', Icon: IconGitPullRequest },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar },
];

function SidebarContent({ onNavigate, onClose }) {
  return (
    <>
      <div style={{ padding: '4px 12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.02em',
          }}
        >
          DevMind
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
          >
            <IconX size={18} />
          </button>
        )}
      </div>

      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'var(--surface-3)' : 'transparent',
            transition:
              'background var(--dur-micro) var(--ease-signature), color var(--dur-micro) var(--ease-signature)',
          })}
        >
          <Icon size={18} stroke={1.75} />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <aside className="sidebar">
        <SidebarContent />
      </aside>
    );
  }

  // Mobile: off-canvas drawer, only mounted (and only capturing clicks) while open.
  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            className="sidebar__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.micro}
            onClick={onClose}
          />
          <motion.aside
            className="sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={transitions.base}
          >
            <SidebarContent onNavigate={onClose} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
