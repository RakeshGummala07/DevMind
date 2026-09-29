import { apiClient } from '../../services/apiClient.js';

export async function askQuestion(repositoryId, message) {
  const { data } = await apiClient.post(`/api/repositories/${repositoryId}/chat`, { message });
  return data.data; // { conversationId, answer, sources, grounded }
}

export async function getChatHistory(repositoryId) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/chat`);
  return data.data; // [{ role, content, sources, grounded, createdAt }]
}

export async function searchCode(repositoryId, query) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/search`, {
    params: { q: query },
  });
  return data.data; // [{ filePath, language, startLine, endLine, snippet, relevance }]
}
