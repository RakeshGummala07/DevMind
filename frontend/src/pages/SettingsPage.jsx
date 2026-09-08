import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IconUsers, IconBellCog, IconCpu } from '@tabler/icons-react';
import PageContainer from '../components/PageContainer.jsx';
import TraceLine from '../components/TraceLine.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
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
      <div style={{ padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface-1)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon size={16} color="var(--text-secondary)" />
          <h3 style={{ fontSize: 15 }}>{title}</h3>
        </div>
        {description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{description}</p>}
        {children}
      </div>
  );
}

function TeamSection({ currentUser }) {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['settings', 'users'], queryFn: listUsers });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'users'] }),
  });

  return (
      <Card icon={IconUsers} title="Team & roles" description="Manage who can access DevMind and what they can do.">
        {usersQuery.isLoading && (
            <div style={{ width: 140 }}><TraceLine active tone="ember" /></div>
        )}
        {usersQuery.isError && (
            <p style={{ fontSize: 12, color: 'var(--critical)' }}>Could not load users.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {usersQuery.data?.map((u) => {
            const isSelf = u.id === currentUser.id;
            const targetIsAdmin = u.role === 'ADMIN';
            const canEditAdminLevel = currentUser.role === 'ADMIN';
            const disabled = isSelf || (targetIsAdmin && !canEditAdminLevel) || roleMutation.isPending;

            return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, minWidth: 160 }}>{u.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{u.email}</span>
                  <select
                      value={u.role}
                      disabled={disabled}
                      onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                      title={isSelf ? "You can't change your own role" : disabled ? 'Only an admin can change an admin\'s role' : undefined}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: disabled ? 'transparent' : 'var(--surface-2)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                      }}
                  >
                    {ROLES.filter((r) => r !== 'ADMIN' || canEditAdminLevel || u.role === 'ADMIN').map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
            );
          })}
        </div>
      </Card>
  );
}

function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const prefsQuery = useQuery({ queryKey: ['settings', 'notification-prefs'], queryFn: getNotificationPreferences });
  const [pending, setPending] = useState(null);

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: (muted) => setPending(muted),
    onSuccess: (muted) => {
      queryClient.setQueryData(['settings', 'notification-prefs'], muted);
      setPending(null);
    },
    onError: () => setPending(null),
  });

  const muted = useMemo(() => new Set(pending ?? prefsQuery.data ?? []), [pending, prefsQuery.data]);

  const toggle = (type) => {
    const next = new Set(muted);
    next.has(type) ? next.delete(type) : next.add(type);
    mutation.mutate(Array.from(next));
  };

  return (
      <Card icon={IconBellCog} title="Notification preferences" description="Turn off notification types you don't want to see.">
        {prefsQuery.isLoading && <div style={{ width: 140 }}><TraceLine active tone="ember" /></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NOTIFICATION_TYPES.map((type) => (
              <label key={type.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={!muted.has(type.key)}
                    onChange={() => toggle(type.key)}
                    disabled={mutation.isPending}
                />
                {type.label}
              </label>
          ))}
        </div>
      </Card>
  );
}

function AiConfigSection() {
  const configQuery = useQuery({ queryKey: ['settings', 'ai-config'], queryFn: getAiConfig });

  return (
      <Card icon={IconCpu} title="AI provider" description="Configured via environment variables at deploy time — not editable here yet.">
        {configQuery.isLoading && <div style={{ width: 140 }}><TraceLine active tone="ember" /></div>}
        {configQuery.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Provider: </span>{configQuery.data.aiProvider}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Chat model: </span>{configQuery.data.aiModel}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Embedding model: </span>{configQuery.data.embeddingModel}</div>
            </div>
        )}
      </Card>
  );
}

export default function SettingsPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const canManageTeam = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_ADMIN';

  return (
      <PageContainer>
        <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={transitions.base}>
          <h2 style={{ marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Notification preferences, AI provider info{canManageTeam ? ', and team roles' : ''}.
          </p>

          <NotificationPreferencesSection />
          <AiConfigSection />
          {canManageTeam && currentUser && <TeamSection currentUser={currentUser} />}
        </motion.div>
      </PageContainer>
  );
}
