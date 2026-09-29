import { useState } from 'react';
import { recordConsent } from '../features/consent/consentApi.js';

export default function ConsentCheckbox({ purpose, label, required = false, onChange }) {
    const [checked, setChecked] = useState(false);
    const [saving, setSaving] = useState(false);

    async function handleChange(e) {
        const next = e.target.checked;
        setChecked(next);
        onChange?.(next);
        setSaving(true);
        try {
            await recordConsent(purpose, next);
        } finally {
            setSaving(false);
        }
    }

    return (
        <label className="consent-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                required={required}
                aria-describedby={`consent-${purpose}-desc`}
            />
            <span id={`consent-${purpose}-desc`}>
        {label} {saving && <em style={{ opacity: 0.6 }}>(saving…)</em>}
      </span>
        </label>
    );
}