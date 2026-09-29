import { apiClient } from '../../services/apiClient.js';

const LOCAL_FALLBACK_KEY = 'devmind_consent_v1';

export async function recordConsent(purpose, granted) {
    const record = {
        purpose,
        granted,
        timestamp: new Date().toISOString(),
        policyVersion: '2026-09-draft', // bump when Privacy Notice copy changes materially
    };
    try {
        const { data } = await apiClient.post('/api/consent', record);
        return data;
    } catch (err) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '{}');
        existing[purpose] = record;
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(existing));
        return record;
    }
}

export async function getConsent(purpose) {
    try {
        const { data } = await apiClient.get(`/api/consent/${purpose}`);
        return data;
    } catch (err) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '{}');
        return existing[purpose] ?? null;
    }
}

export function getAllLocalConsent() {
    return JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '{}');
}