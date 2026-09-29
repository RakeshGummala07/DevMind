
const DEV_API_FALLBACK = 'http://localhost:9000';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  rawApiBase !== undefined && rawApiBase !== '' ? rawApiBase : import.meta.env.DEV ? DEV_API_FALLBACK : ''
).replace(/\/+$/, '');

/** Full-page redirect target that starts the GitHub OAuth flow (handled by auth-service). */
export const GITHUB_OAUTH_START_URL = `${API_BASE_URL}/api/auth/oauth/github`;

export const APP_NAME = 'DevMind';
