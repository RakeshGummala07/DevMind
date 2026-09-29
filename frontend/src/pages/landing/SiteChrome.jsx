import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Logo from '../../components/Logo.jsx';
import Button from '../../components/Button.jsx';
import { APP_NAME } from '../../config/env.js';

export function SiteHeader() {
  const authenticated = useSelector((s) => s.auth.status === 'authenticated');
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="logo-link" aria-label={`${APP_NAME} home`}>
          <Logo />
        </Link>
        <nav aria-label="Primary" className="site-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="site-header__cta">
          {authenticated ? (
            <Button to="/dashboard" size="sm">Open dashboard</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Sign in</Button>
              <Button to="/register" size="sm">Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo />
          <p>AI developer intelligence for your GitHub repositories. Answers that cite their source.</p>
        </div>
        <nav aria-label="Footer" className="site-footer__links">
          <div>
            <h2>Product</h2>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
          </div>
          <div>
            <h2>Account</h2>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create an account</Link>
          </div>
        </nav>
      </div>
      <div className="site-footer__legal">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</div>
    </footer>
  );
}
