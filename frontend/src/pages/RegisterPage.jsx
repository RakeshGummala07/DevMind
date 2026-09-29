import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IconAlertCircle } from '@tabler/icons-react';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { TextField } from '../components/ui/Field.jsx';
import { registerRequest } from '../features/auth/authApi.js';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function RegisterPage() {
  usePageTitle('Create your account');
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
    <AuthShell>
      <h1 className="auth__title">Create your account</h1>
      <p className="auth__lead">
        Or connect with GitHub from the <Link to="/login">sign-in page</Link> instead.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            <IconAlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <TextField label="Name" name="name" autoComplete="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button type="submit" block loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="auth__foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
