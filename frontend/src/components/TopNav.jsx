import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { IconSearch, IconLogout, IconMenu2, IconUser, IconSettings } from '@tabler/icons-react';
import { m } from './Motion.jsx';
import { logout as logoutAction } from '../features/auth/authSlice.js';
import { logoutRequest } from '../features/auth/authApi.js';
import { transitions } from '../utils/motionTokens.js';
import { safeExternalUrl } from '../utils/safeUrl.js';
import { useDismiss } from '../hooks/useDismiss.js';
import NotificationBell from './NotificationBell.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import CommandPalette from './CommandPalette.jsx';

function Avatar({ user, size = 30 }) {
  const src = safeExternalUrl(user?.avatarUrl);
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" width={size} height={size} /> : initial}
    </span>
  );
}

export { Avatar };

export default function TopNav({ onMenuClick }) {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef(null);
  useDismiss(menuRef, menuOpen, () => setMenuOpen(false));

  // Ctrl/⌘ + K opens the "Jump to" palette from anywhere in the app.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logoutRequest();
    } finally {
      dispatch(logoutAction());
      // Drop everything cached for this user so the next person to sign in on
      // this browser can never briefly see the previous account's data.
      queryClient.clear();
      navigate('/login');
    }
  };

  return (
    <header className="topnav">
      <div className="topnav__left">
        <button type="button" className="icon-btn show-mobile" onClick={onMenuClick} aria-label="Open menu">
          <IconMenu2 size={20} />
        </button>
        <div className="hide-mobile">
          <Breadcrumbs />
        </div>
      </div>

      <div className="topnav__right">
        <button type="button" className="topnav__search" onClick={() => setPaletteOpen(true)} aria-label="Jump to a page or repository">
          <IconSearch size={16} aria-hidden="true" />
          <span className="topnav__search-label">Jump to…</span>
          <kbd className="hide-mobile">Ctrl K</kbd>
        </button>

        <NotificationBell />

        <div className="usermenu" ref={menuRef}>
          <button
            type="button"
            className="usermenu__trigger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Avatar user={user} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <m.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transitions.micro}
                className="popover usermenu__panel"
              >
                <div className="usermenu__who">
                  <strong>{user?.name}</strong>
                  {user?.email && <span>{user.email}</span>}
                  {user?.role && <span className="mono usermenu__role">{user.role}</span>}
                </div>
                <Link to="/profile" className="usermenu__item" onClick={() => setMenuOpen(false)}>
                  <IconUser size={16} aria-hidden="true" /> Profile
                </Link>
                <Link to="/settings" className="usermenu__item" onClick={() => setMenuOpen(false)}>
                  <IconSettings size={16} aria-hidden="true" /> Settings
                </Link>
                <button type="button" className="usermenu__item usermenu__item--danger" onClick={handleLogout}>
                  <IconLogout size={16} aria-hidden="true" /> Sign out
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
