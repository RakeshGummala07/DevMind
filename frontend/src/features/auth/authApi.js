import { apiClient } from '../../services/apiClient.js';

// Every call here relies on the refresh token traveling as an httpOnly
// cookie (see apiClient's withCredentials: true) — the raw refresh token
// never touches JS, only the short-lived access token does, and only in
// memory (Redux), never localStorage.

export async function registerRequest({ name, email, password }) {
  const { data } = await apiClient.post('/api/auth/register', { name, email, password });
  return data.data; // { user, accessToken }
}

export async function loginRequest({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data.data;
}

export async function githubCallbackRequest(code) {
  const { data } = await apiClient.post('/api/auth/oauth/github/callback', { code });
  return data.data;
}

/** Silent refresh — called on app load to restore a session from the refresh cookie, if any. */
export async function refreshRequest() {
  const { data } = await apiClient.post('/api/auth/refresh');
  return data.data;
}

export async function logoutRequest() {
  await apiClient.post('/api/auth/logout');
}
