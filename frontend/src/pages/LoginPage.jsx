import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconBrandGithub } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../components/Button.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
import { loginRequest } from '../features/auth/authApi.js';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  marginBottom: 14,
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGitHubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'}/api/auth/oauth/github`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Enter both your email and password.');
      return;
    }
    setSubmitting(true);
    dispatch(loginStart());
    try {
      const { user, accessToken } = await loginRequest(form);
      dispatch(loginSuccess({ user, accessToken }));
      navigate('/dashboard');
    } catch (err) {
      dispatch(loginFailure());
      setError(err.response?.data?.error?.message || 'Could not sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={transitions.page}
      style={{
        padding: '0 16px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 'min(380px, 100%)',
          padding: 32,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          background: 'var(--surface-1)',
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Sign in to DevMind</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Connect your GitHub account, or sign in with email.
        </p>

        <Button
          type="button"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 }}
          onClick={handleGitHubLogin}
        >
          <IconBrandGithub size={18} />
          Continue with GitHub
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <input
          style={inputStyle}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <Button variant="secondary" type="submit" style={{ width: '100%' }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--signal)' }}>
            Create an account
          </Link>{' '}
          instead.
        </p>
      </form>
    </motion.div>
  );
}
