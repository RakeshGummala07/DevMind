import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import TraceLine from '../components/TraceLine.jsx';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';
import { githubCallbackRequest } from '../features/auth/authApi.js';
import { fadeIn, transitions } from '../utils/motionTokens.js';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // GitHub authorization codes are single-use. React 18 StrictMode
  // double-invokes effects in dev, which would otherwise fire this exchange
  // twice with the same code — the second call fails (code already
  // consumed) and can overwrite a successful login. This ref makes the
  // exchange run at most once per code, regardless of how many times the
  // effect fires.
  const exchangedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login');
      return;
    }
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    dispatch(loginStart());
    githubCallbackRequest(code)
      .then(({ user, accessToken }) => {
        dispatch(loginSuccess({ user, accessToken }));
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        dispatch(loginFailure());
        navigate('/login', { replace: true });
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
