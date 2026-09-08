import { useState } from 'react';
import { IconSearch, IconLogout, IconMenu2 } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logout as logoutAction } from '../features/auth/authSlice.js';
import { logoutRequest } from '../features/auth/authApi.js';
import { transitions } from '../utils/motionTokens.js';
import NotificationBell from './NotificationBell.jsx';

export default function TopNav({ onMenuClick }) {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        setMenuOpen(false);
        try {
            await logoutRequest();
        } finally {
            dispatch(logoutAction());
            navigate('/login');
        }
    };

    return (
        <div className="topnav-wrap">
            <div className="topnav">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        className="show-mobile"
                        onClick={onMenuClick}
                        aria-label="Open menu"
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
                    >
                        <IconMenu2 size={20} />
                    </button>
                    <div className="topnav__search">
                        <IconSearch size={16} />
                        <span style={{ fontSize: 13 }}>Search repositories, code, PRs…</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
                    <div className="hide-mobile">
                        <NotificationBell />
                    </div>
                    <div
                        onClick={() => setMenuOpen((open) => !open)}
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
                            cursor: 'pointer',
                        }}
                    >
                        {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={transitions.micro}
                                style={{
                                    position: 'absolute',
                                    top: 40,
                                    right: 0,
                                    background: 'rgba(22, 27, 38, 0.9)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    minWidth: 160,
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 2,
                                        padding: '10px 14px',
                                        borderBottom: '1px solid var(--border)',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottomWidth: 1,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role} · View profile</div>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 14px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--critical)',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <IconLogout size={15} />
                                    Sign out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}