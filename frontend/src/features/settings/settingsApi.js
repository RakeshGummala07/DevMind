import { apiClient } from '../../services/apiClient.js';

// auth-service — user/role management (admin & team-admin only; backend enforces this)
export async function listUsers() {
  const { data } = await apiClient.get('/api/auth/users');
  return data.data; // [{ id, name, email, avatarUrl, githubUsername, role, createdAt }]
}

export async function updateUserRole(userId, role) {
  const { data } = await apiClient.patch(`/api/auth/users/${userId}/role`, { role });
  return data.data;
}

// notification-service — per-user muted notification types
export async function getNotificationPreferences() {
  const { data } = await apiClient.get('/api/notifications/preferences');
  return data.data.mutedTypes; // string[]
}

export async function updateNotificationPreferences(mutedTypes) {
  const { data } = await apiClient.put('/api/notifications/preferences', { mutedTypes });
  return data.data.mutedTypes;
}

// ai-service — read-only, set via env vars at deploy time
export async function getAiConfig() {
  const { data } = await apiClient.get('/api/config');
  return data.data; // { aiProvider, aiModel, embeddingModel }
}
