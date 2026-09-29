import { useState } from 'react';
import { IconBrandGithub, IconAlertCircle } from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { TextField } from '../components/ui/Field.jsx';
import { loginRequest } from '../features/auth/authApi.js';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';
import { GITHUB_OAUTH_START_URL } from '../config/env.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function LoginPage() {
  usePageTitle('Sign in');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const oauthFailed = location.state?.oauthError === true;

  const handleGitHubLogin = () => {
    window.location.href = GITHUB_OAUTH_START_URL;
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

  const message = error || (oauthFailed ? 'GitHub sign-in didn’t complete. Try again, or sign in with email.' : '');

  return (
    <AuthShell>
      <h1 className="auth__title">Sign in to DevMind</h1>
      <p className="auth__lead">Connect your GitHub account, or sign in with email.</p>

      <Button block icon={IconBrandGithub} onClick={handleGitHubLogin}>
        Continue with GitHub
      </Button>

      <div className="divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {message && (
          <div className="form-error" role="alert">
            <IconAlertCircle size={16} aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}
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
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button variant="secondary" type="submit" block loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="auth__foot">
        New here? <Link to="/register">Create an account</Link> instead.
      </p>
    </AuthShell>
  );
}
