import { motion } from 'framer-motion';
import { IconBrandGithub } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';

export default function LoginPage() {
  const handleGitHubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'}/api/auth/oauth/github`;
  };

  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={transitions.page}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 380,
          padding: 32,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          background: 'var(--surface-1)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Sign in to DevMind</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
          Connect your GitHub account to index and query your repositories.
        </p>

        <Button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleGitHubLogin}>
          <IconBrandGithub size={18} />
          Continue with GitHub
        </Button>

        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--signal)' }}>
            Create an account
          </Link>{' '}
          instead.
        </p>
      </div>
    </motion.div>
  );
}
