import { useSelector } from 'react-redux';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Avatar } from '../components/TopNav.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ROLE_DESCRIPTIONS = {
  USER: 'Standard access — connect and query your own repositories.',
  DEVELOPER: 'Can trigger indexing and request AI reviews on team repositories.',
  TEAM_ADMIN: 'Manages team membership and repository permissions.',
  ADMIN: 'Full platform access, including user and role management.',
};

export default function ProfilePage() {
  usePageTitle('Profile');
  const user = useSelector((state) => state.auth.user);

  if (!user) return null;

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Your account details and role." />

      <section className="card profile" aria-label="Account details">
        <Avatar user={user} size={64} />
        <div className="profile__body">
          <h2 className="profile__name">{user.name}</h2>
          <p className="profile__email">{user.email}</p>
          <Badge tone="signal" className="badge--mono">{user.role}</Badge>
          <p className="profile__role">{ROLE_DESCRIPTIONS[user.role]}</p>
        </div>
      </section>
    </PageContainer>
  );
}
