import { apiClient } from '../../services/apiClient.js';

export async function triggerReview(repositoryId, prNumber) {
    const { data } = await apiClient.post(
        `/api/analytics/repositories/${repositoryId}/pull-requests/${prNumber}/reviews`
    );
    return data.data; // { id, status: 'PENDING', ... }
}

export async function getLatestReview(repositoryId, prNumber) {
    const { data } = await apiClient.get(
        `/api/analytics/repositories/${repositoryId}/pull-requests/${prNumber}/reviews/latest`
    );
    return data.data; // { id, status, filesReviewed, findingsCount, summary, findings: [...] }
}

export async function getReviewHistory(repositoryId) {
    const { data } = await apiClient.get(`/api/analytics/repositories/${repositoryId}/reviews`);
    return data.data; // [{ id, prNumber, status, findingsCount, createdAt, ... }]
}

export async function getReview(reviewId) {
    const { data } = await apiClient.get(`/api/analytics/reviews/${reviewId}`);
    return data.data;
}