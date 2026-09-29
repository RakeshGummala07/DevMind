import { useEffect, useState } from 'react';
import { recordConsent, getConsent } from '../features/consent/consentApi.js';

const DISMISSED_KEY = 'devmind_consent_banner_dismissed_v1';

export default function ConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(DISMISSED_KEY)) {
            setVisible(true);
        }
    }, []);

    async function choose(granted) {
        await recordConsent('non_essential_trackers', granted);
        localStorage.setItem(DISMISSED_KEY, '1');
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie and tracking consent"
            className="consent-banner"
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
                background: 'var(--bg-elevated, #14181f)', color: 'var(--text, #eaeaea)',
                padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center',
                flexWrap: 'wrap', borderTop: '1px solid var(--border, #2a2f3a)',
            }}
        >
            <p style={{ margin: 0, flex: '1 1 280px' }}>
                DevMind uses only the cookies/storage required to run (session, login). We don't currently use
                analytics or advertising trackers. If that changes, this banner will ask before anything non-essential
                loads. See our <a href="/privacy">Privacy Notice</a>.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => choose(false)}>Decline non-essential</button>
                <button type="button" onClick={() => choose(true)}>Accept</button>
            </div>
        </div>
    );
}