import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { m } from '../components/Motion.jsx';
import TraceLine from '../components/TraceLine.jsx';
import Logo from '../components/Logo.jsx';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice.js';
import { githubCallbackRequest } from '../features/auth/authApi.js';
import { fadeIn, transitions } from '../utils/motionTokens.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function OAuthCallbackPage() {
  usePageTitle('Signing you in');
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
        navigate('/login', { replace: true, state: { oauthError: true } });
      });
  }, [searchParams, navigate, dispatch]);

  return (
    <m.main id="main" className="center-screen" initial={fadeIn.initial} animate={fadeIn.animate} transition={transitions.base}>
      <Logo size={36} />
      <p className="center-screen__text" role="status">
        Finishing sign-in…
      </p>
      <div className="trace-slot">
        <TraceLine active tone="ember" label="Signing you in" />
      </div>
    </m.main>
  );
}
