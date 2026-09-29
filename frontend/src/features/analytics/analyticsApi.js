import { apiClient } from '../../services/apiClient.js';

// repository-service — commit + PR lifecycle data synced from GitHub
export async function syncRepositoryAnalytics(repositoryId) {
  const { data } = await apiClient.post(`/api/repositories/${repositoryId}/analytics/sync`);
  return data.data; // { newCommits, syncedPullRequests }
}

export async function getCommitActivity(repositoryId, days = 30) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/analytics/commits`, { params: { days } });
  return data.data; // { totalCommits, byDay: [{date,count}], topContributors: [{login,count}] }
}

export async function getPullRequestSummary(repositoryId) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/analytics/pull-requests`);
  return data.data; // { openCount, mergedCount, closedCount, avgTimeToMergeHours, recent: [...] }
}

// ai-service — chat/search usage
export async function getAiUsage(repositoryId) {
  const { data } = await apiClient.get(`/api/repositories/${repositoryId}/analytics/usage`);
  return data.data; // { conversationCount, messageCount, groundedAnswerCount, ungroundedAnswerCount }
}

// analysis-service — PR review turnaround + findings by severity
export async function getReviewSummary(repositoryId) {
  const { data } = await apiClient.get(`/api/analytics/repositories/${repositoryId}/summary`);
  return data.data; // { totalReviews, completedReviews, failedReviews, avgTurnaroundSeconds, findingsBySeverity: [...] }
}
