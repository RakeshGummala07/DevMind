import { useState } from 'react';
import PageContainer from '../components/PageContainer.jsx';
import { apiClient } from '../services/apiClient.js';

const REQUEST_TYPES = [
    { value: 'access', label: 'Access — send me a copy of my data' },
    { value: 'correct', label: 'Correct — fix inaccurate data' },
    { value: 'erase', label: 'Erase — delete my data' },
    { value: 'withdraw_consent', label: 'Withdraw a consent I previously gave' },
];

export default function DataRightsRequestPage() {
    const [form, setForm] = useState({ type: 'access', email: '', details: '' });
    const [status, setStatus] = useState('idle');

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('submitting');
        try {
            await apiClient.post('/api/data-rights-requests', form);
            setStatus('submitted');
        } catch (err) {
            setStatus('error');
        }
    }

    if (status === 'submitted') {
        return (
            <PageContainer>
                <h1>Request received</h1>
                <p>
                    We&apos;ve logged your request and will respond within 10-20 days. A confirmation has been sent to {form.email}.
                </p>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <h1>Data Rights Request</h1>
            <p>Use this form to access, correct, erase your data, or withdraw a consent.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
                <label>
                    Request type
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        {REQUEST_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Email associated with your account
                    <input
                        type="email" required value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </label>
                <label>
                    Details (optional)
                    <textarea
                        rows={4} value={form.details}
                        onChange={(e) => setForm({ ...form, details: e.target.value })}
                    />
                </label>
                {status === 'error' && (
                    <p role="alert">
                        Something went wrong submitting this — the backend endpoint for this form may not be
                        built yet.
                    </p>
                )}
                <button type="submit" disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Submitting…' : 'Submit request'}
                </button>
            </form>
        </PageContainer>
    );
}