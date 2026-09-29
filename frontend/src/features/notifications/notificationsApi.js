import { apiClient } from '../../services/apiClient.js';

export async function listNotifications(unreadOnly = false) {
  const { data } = await apiClient.get('/api/notifications', { params: { unreadOnly } });
  return data.data; // [{ id, type, title, message, repositoryId, read, createdAt }]
}

export async function getUnreadCount() {
  const { data } = await apiClient.get('/api/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.post(`/api/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  await apiClient.post('/api/notifications/read-all');
}
