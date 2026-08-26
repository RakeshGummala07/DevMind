import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../components/Button.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';
import { registerRequest } from '../features/auth/authApi.js';
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

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Fill in every field to create an account.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    dispatch(loginStart());
    try {
      const { user, accessToken } = await registerRequest(form);
      dispatch(loginSuccess({ user, accessToken }));
      navigate('/dashboard');
    } catch (err) {
      dispatch(loginFailure());
      setError(err.response?.data?.error?.message || 'Could not create your account.');
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
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        <h2 style={{ marginBottom: 8 }}>Create your account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          Or connect with GitHub from the sign-in page instead.
        </p>

        <input
          style={inputStyle}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Password (min. 8 characters)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <Button type="submit" style={{ width: '100%' }}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--signal)' }}>
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
