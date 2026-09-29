import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import Button from '../Button.jsx';

/** Friendly failure state. Never pass raw error text in — describe what happened in plain words. */
export default function ErrorState({ title = 'Something went wrong', message, onRetry, retrying = false, compact = false, children }) {
  return (
    <div className={`state state--error${compact ? ' state--compact' : ''}`} role="alert">
      <div className="state__icon" aria-hidden="true">
        <IconAlertTriangle size={compact ? 20 : 24} stroke={1.5} />
      </div>
      <h3 className="state__title">{title}</h3>
      {message && <p className="state__text">{message}</p>}
      {(onRetry || children) && (
        <div className="state__actions">
          {onRetry && (
            <Button variant="secondary" size="sm" icon={IconRefresh} onClick={onRetry} loading={retrying}>
              Try again
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
