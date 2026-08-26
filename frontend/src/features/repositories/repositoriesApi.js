import { apiClient } from '../../services/apiClient.js';

export async function listConnectedRepositories() {
  const { data } = await apiClient.get('/api/repositories');
  return data.data;
}

export async function listAvailableRepositories() {
  const { data } = await apiClient.get('/api/repositories/available');
  return data.data;
}

export async function connectRepository(fullName) {
  const { data } = await apiClient.post('/api/repositories/connect', { fullName });
  return data.data;
}

export async function getRepository(id) {
  const { data } = await apiClient.get(`/api/repositories/${id}`);
  return data.data;
}

export async function requestIndexing(id) {
  const { data } = await apiClient.post(`/api/repositories/${id}/index`);
  return data.data;
}
