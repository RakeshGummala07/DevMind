import { useId, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/**
 * Labelled text input. The label is always visible (placeholders are hints,
 * not labels) and errors are tied to the control via aria-describedby.
 */
export function TextField({ label, hint, error, type = 'text', className = '', ...inputProps }) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        <input
          id={id}
          className={`input${error ? ' input--error' : ''}${isPassword ? ' input--has-action' : ''}`}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__action"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            aria-pressed={reveal}
          >
            {reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
