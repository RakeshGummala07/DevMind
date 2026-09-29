import { IconCompassOff } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/Button.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  const authenticated = useSelector((s) => s.auth.status === 'authenticated');
  return (
    <main className="center-screen" id="main">
      <EmptyState
        icon={IconCompassOff}
        title="We couldn’t find that page"
        description="The link may be out of date, or the page may have moved."
        action={<Button to={authenticated ? '/dashboard' : '/'}>{authenticated ? 'Go to dashboard' : 'Back to home'}</Button>}
      />
    </main>
  );
}
