import { NavLink } from 'react-router-dom';
import { IconLayoutDashboard, IconFolder, IconGitPullRequest, IconChartBar } from '@tabler/icons-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconLayoutDashboard },
  { to: '/repositories', label: 'Repositories', Icon: IconFolder },
  { to: '/reviews', label: 'Reviews', Icon: IconGitPullRequest },
  { to: '/analytics', label: 'Analytics', Icon: IconChartBar },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface-1)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ padding: '4px 12px 20px' }}>
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
      </div>

      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
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
    </aside>
  );
}
