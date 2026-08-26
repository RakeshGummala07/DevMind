import { useSelector } from 'react-redux';
import PageContainer from '../components/PageContainer.jsx';

const ROLE_DESCRIPTIONS = {
  USER: 'Standard access — connect and query your own repositories.',
  DEVELOPER: 'Can trigger indexing and request AI reviews on team repositories.',
  TEAM_ADMIN: 'Manages team membership and repository permissions.',
  ADMIN: 'Full platform access, including user and role management.',
};

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <PageContainer>
      <h1 style={{ marginBottom: 4 }}>Profile</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Your account details and role.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: 24,
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface-1)',
          maxWidth: 480,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--surface-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 2 }}>{user.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>{user.email}</div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--signal-dim)',
              color: 'var(--signal)',
              border: '1px solid var(--signal-dim)',
            }}
          >
            {user.role}
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10 }}>
            {ROLE_DESCRIPTIONS[user.role]}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
