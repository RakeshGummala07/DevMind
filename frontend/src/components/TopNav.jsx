import { IconSearch, IconBell } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import TraceLine from './TraceLine.jsx';

export default function TopNav({ traceActive = false }) {
  const user = useSelector((state) => state.auth.user);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <div
        style={{
          height: 'var(--topnav-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--surface-1)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            width: 320,
            color: 'var(--text-muted)',
          }}
        >
          <IconSearch size={16} />
          <span style={{ fontSize: 13 }}>Search repositories, code, PRs…</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <IconBell size={18} color="var(--text-secondary)" />
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--surface-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </div>
      <TraceLine active={traceActive} tone="ember" />
    </div>
  );
}
