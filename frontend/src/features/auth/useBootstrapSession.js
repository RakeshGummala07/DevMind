import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from './authSlice.js';
import { refreshRequest } from './authApi.js';

/**
 * On first mount, tries to silently exchange the httpOnly refresh cookie
 * (if present) for a fresh access token. If there's no cookie or it's
 * expired/revoked, this just fails quietly and the user lands on /login —
 * no error is surfaced, since "not logged in" isn't an error state.
 */
export function useBootstrapSession() {
  const dispatch = useDispatch();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    dispatch(loginStart());
    refreshRequest()
      .then(({ user, accessToken }) => dispatch(loginSuccess({ user, accessToken })))
      .catch(() => dispatch(loginFailure()))
      .finally(() => setChecked(true));
  }, [dispatch]);

  return checked;
}
