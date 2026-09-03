import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBell, IconGitPullRequest, IconFolderSearch, IconAlertTriangle } from '@tabler/icons-react';
import { transitions } from '../utils/motionTokens.js';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../features/notifications/notificationsApi.js';

const TYPE_ICON = {
  INDEX_COMPLETED: { Icon: IconFolderSearch, color: 'var(--signal)' },
  INDEX_FAILED: { Icon: IconAlertTriangle, color: 'var(--critical)' },
  REVIEW_COMPLETED: { Icon: IconGitPullRequest, color: 'var(--signal)' },
  REVIEW_FAILED: { Icon: IconAlertTriangle, color: 'var(--critical)' },
};

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 20000,
  });

  const listQuery = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => listNotifications(false),
    enabled: open, // only fetch the full list once the dropdown is actually opened
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) markReadMutation.mutate(notification.id);
    setOpen(false);

    if (!notification.repositoryId) return;
    if (notification.type.startsWith('REVIEW_')) {
      navigate(`/repositories/${notification.repositoryId}/pull-requests`);
    } else if (notification.type.startsWith('INDEX_')) {
      navigate(`/repositories/${notification.repositoryId}`);
    }
  };

  const unreadCount = countQuery.data ?? 0;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
        }}
      >
        <IconBell size={18} color="var(--text-secondary)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 14,
              height: 14,
              padding: '0 3px',
              borderRadius: 7,
              background: 'var(--ember)',
              color: '#1a0e05',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-outside catcher */}
            <div
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transitions.micro}
              style={{
                position: 'absolute',
                top: 32,
                right: 0,
                width: 340,
                maxHeight: 420,
                overflowY: 'auto',
                background: 'rgba(22, 27, 38, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                zIndex: 41,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {listQuery.isLoading && (
                <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
              )}

              {listQuery.data?.length === 0 && (
                <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  Nothing yet. You'll see indexing and PR review updates here.
                </div>
              )}

              {listQuery.data?.map((notification) => {
                const { Icon, color } = TYPE_ICON[notification.type] ?? { Icon: IconBell, color: 'var(--text-muted)' };
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      background: notification.read ? 'transparent' : 'var(--surface-2)',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.message}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {timeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.read && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ember)',
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
