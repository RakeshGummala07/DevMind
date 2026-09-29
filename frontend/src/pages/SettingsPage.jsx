import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconUsers, IconBellCog, IconCpu } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton, LoadingRegion } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { apiErrorMessage } from '../utils/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import {
  listUsers, updateUserRole, getNotificationPreferences, updateNotificationPreferences, getAiConfig,
} from '../features/settings/settingsApi.js';

const ROLES = ['USER', 'DEVELOPER', 'TEAM_ADMIN', 'ADMIN'];

const NOTIFICATION_TYPES = [
  { key: 'INDEX_COMPLETED', label: 'Repository indexing finished' },
  { key: 'INDEX_FAILED', label: 'Repository indexing failed' },
  { key: 'REVIEW_COMPLETED', label: 'AI PR review finished' },
  { key: 'REVIEW_FAILED', label: 'AI PR review failed' },
];

function Card({ icon: Icon, title, description, children }) {
  return (
      <section className="card settings-card" aria-label={title}>
        <div className="card__title-row">
          <Icon size={17} aria-hidden="true" className="muted-icon" />
          <h2>{title}</h2>
        </div>
        {description && <p className="card__desc">{description}</p>}
        {children}
      </section>
  );
}

function TeamSection({ currentUser }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const usersQuery = useQuery({ queryKey: ['settings', 'users'], queryFn: listUsers });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: (_data, { role }) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
      toast.success(`Role updated to ${role}.`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Couldn’t update that role. You may not have permission.')),
  });

  return (
      <Card icon={IconUsers} title="Team & roles" description="Manage who can access DevMind and what they can do.">
        {usersQuery.isLoading && (
            <LoadingRegion label="Loading team">
              <Skeleton height={36} radius={8} />
              <Skeleton height={36} radius={8} style={{ marginTop: 8 }} />
            </LoadingRegion>
        )}
        {usersQuery.isError && (
            <ErrorState compact title="Couldn’t load users" onRetry={() => usersQuery.refetch()} retrying={usersQuery.isFetching} />
        )}
        <ul className="plain-list plain-list--gap-sm">
          {usersQuery.data?.map((u) => {
            const isSelf = u.id === currentUser.id;
            const targetIsAdmin = u.role === 'ADMIN';
            const canEditAdminLevel = currentUser.role === 'ADMIN';
            const disabled = isSelf || (targetIsAdmin && !canEditAdminLevel) || roleMutation.isPending;

            return (
                <li key={u.id} className="user-row">
                  <span className="user-row__name">{u.name}</span>
                  <span className="user-row__email">{u.email}</span>
                  <select
                      className="select"
                      value={u.role}
                      disabled={disabled}
                      onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                      aria-label={`Role for ${u.name}`}
                      title={isSelf ? "You can't change your own role" : disabled ? 'Only an admin can change an admin\'s role' : undefined}
                  >
                    {ROLES.filter((r) => r !== 'ADMIN' || canEditAdminLevel || u.role === 'ADMIN').map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </li>
            );
          })}
        </ul>
      </Card>
  );
}

function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefsQuery = useQuery({ queryKey: ['settings', 'notification-prefs'], queryFn: getNotificationPreferences });
  const [pending, setPending] = useState(null);

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: (muted) => setPending(muted),
    onSuccess: (muted) => {
      queryClient.setQueryData(['settings', 'notification-prefs'], muted);
      setPending(null);
      toast.success('Notification preferences saved.');
    },
    onError: () => {
      setPending(null);
      toast.error('Couldn’t save your preferences. Try again.');
    },
  });

  const muted = useMemo(() => new Set(pending ?? prefsQuery.data ?? []), [pending, prefsQuery.data]);

  const toggle = (type) => {
    const next = new Set(muted);
    next.has(type) ? next.delete(type) : next.add(type);
    mutation.mutate(Array.from(next));
  };

  return (
      <Card icon={IconBellCog} title="Notification preferences" description="Turn off notification types you don't want to see.">
        {prefsQuery.isLoading && (
          <LoadingRegion label="Loading preferences"><Skeleton height={20} width="60%" /></LoadingRegion>
        )}
        {prefsQuery.isError && (
          <ErrorState compact title="Couldn’t load your preferences" onRetry={() => prefsQuery.refetch()} retrying={prefsQuery.isFetching} />
        )}
        {!prefsQuery.isLoading && !prefsQuery.isError && (
          <fieldset className="fieldset">
            <legend className="sr-only">Notification types</legend>
            {NOTIFICATION_TYPES.map((type) => (
                <label key={type.key} className="checkbox">
                  <input
                      type="checkbox"
                      checked={!muted.has(type.key)}
                      onChange={() => toggle(type.key)}
                      disabled={mutation.isPending}
                  />
                  {type.label}
                </label>
            ))}
          </fieldset>
        )}
      </Card>
  );
}

function AiConfigSection() {
  const configQuery = useQuery({ queryKey: ['settings', 'ai-config'], queryFn: getAiConfig });

  return (
      <Card icon={IconCpu} title="AI provider" description="Configured via environment variables at deploy time — not editable here yet.">
        {configQuery.isLoading && <LoadingRegion label="Loading AI configuration"><Skeleton height={16} width="50%" /></LoadingRegion>}
        {configQuery.isError && (
          <ErrorState compact title="Couldn’t load the AI configuration" onRetry={() => configQuery.refetch()} retrying={configQuery.isFetching} />
        )}
        {configQuery.data && (
            <dl className="kv">
              <div><dt>Provider</dt><dd className="mono">{configQuery.data.aiProvider}</dd></div>
              <div><dt>Chat model</dt><dd className="mono">{configQuery.data.aiModel}</dd></div>
              <div><dt>Embedding model</dt><dd className="mono">{configQuery.data.embeddingModel}</dd></div>
            </dl>
        )}
      </Card>
  );
}

export default function SettingsPage() {
  usePageTitle('Settings');
  const currentUser = useSelector((state) => state.auth.user);
  const canManageTeam = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_ADMIN';

  return (
      <PageContainer>
        <PageHeader
          title="Settings"
          description={`Notification preferences, AI provider info${canManageTeam ? ', and team roles' : ''}.`}
        />
        <div className="settings-stack">
          <NotificationPreferencesSection />
          <AiConfigSection />
          {canManageTeam && currentUser && <TeamSection currentUser={currentUser} />}
        </div>
      </PageContainer>
  );
}
