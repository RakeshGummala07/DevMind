import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { IconBell, IconGitPullRequest, IconFolderSearch, IconAlertTriangle } from '@tabler/icons-react';
import { m } from './Motion.jsx';
import { transitions } from '../utils/motionTokens.js';
import { timeAgo } from '../utils/format.js';
import { useDismiss } from '../hooks/useDismiss.js';
import { Skeleton, LoadingRegion } from './ui/Skeleton.jsx';
import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useDismiss(rootRef, open, () => setOpen(false));

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
    <div className="bell" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <IconBell size={19} />
        {unreadCount > 0 && (
          <span className="bell__count" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transitions.micro}
            className="popover bell__panel"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="bell__head">
              <h2>Notifications</h2>
              {unreadCount > 0 && (
                <button type="button" className="bell__markall" onClick={() => markAllReadMutation.mutate()}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="bell__body">
              {listQuery.isLoading && (
                <LoadingRegion label="Loading notifications">
                  <div className="bell__skeletons">
                    <Skeleton height={12} width="70%" />
                    <Skeleton height={10} width="90%" />
                    <Skeleton height={12} width="60%" style={{ marginTop: 14 }} />
                    <Skeleton height={10} width="80%" />
                  </div>
                </LoadingRegion>
              )}

              {listQuery.isError && (
                <ErrorState compact title="Couldn’t load notifications" onRetry={() => listQuery.refetch()} retrying={listQuery.isFetching} />
              )}

              {listQuery.data?.length === 0 && (
                <EmptyState compact icon={IconBell} title="You’re all caught up" description="Indexing and PR review updates will show up here." />
              )}

              {listQuery.data?.map((notification) => {
                const { Icon, color } = TYPE_ICON[notification.type] ?? { Icon: IconBell, color: 'var(--text-muted)' };
                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bell__item${notification.read ? '' : ' is-unread'}`}
                  >
                    <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    <span className="bell__text">
                      <span className="bell__title">{notification.title}</span>
                      <span className="bell__message">{notification.message}</span>
                      <span className="bell__time">{timeAgo(notification.createdAt)}</span>
                    </span>
                    {!notification.read && <span className="bell__dot" aria-label="Unread" />}
                  </button>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
