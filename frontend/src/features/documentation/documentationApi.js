import { apiClient } from '../../services/apiClient.js';

export async function generateDocument(repositoryId, docType) {
  const { data } = await apiClient.post(`/api/repositories/${repositoryId}/documentation/generate`, { docType });
  return data.data; // { id, docType, content, grounded, generatedAt }
}

export async function listDocuments(repositoryId) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/documentation`);
  return data.data; // [{ id, docType, content, grounded, generatedAt }] — latest per type
}
