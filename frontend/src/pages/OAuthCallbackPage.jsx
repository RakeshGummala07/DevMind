import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import TraceLine from '../components/TraceLine.jsx';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';
import { apiClient } from '../services/apiClient.js';
import { fadeIn, transitions } from '../utils/motionTokens.js';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login');
      return;
    }

    dispatch(loginStart());
    apiClient
      .post('/api/auth/oauth/github/callback', { code })
      .then(({ data }) => {
        dispatch(loginSuccess({ user: data.data.user, accessToken: data.data.accessToken }));
        navigate('/dashboard');
      })
      .catch(() => {
        dispatch(loginFailure());
        navigate('/login');
      });
  }, [searchParams, navigate, dispatch]);

  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      transition={transitions.base}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Finishing sign-in…</p>
      <div style={{ width: 200 }}>
        <TraceLine active tone="ember" />
      </div>
    </motion.div>
  );
}
