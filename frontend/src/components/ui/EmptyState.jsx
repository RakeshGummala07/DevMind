import { IconInbox } from '@tabler/icons-react';

export default function EmptyState({ icon: Icon = IconInbox, title, description, action, compact = false }) {
  return (
    <div className={`state${compact ? ' state--compact' : ''}`}>
      <div className="state__icon" aria-hidden="true">
        <Icon size={compact ? 20 : 24} stroke={1.5} />
      </div>
      <h3 className="state__title">{title}</h3>
      {description && <p className="state__text">{description}</p>}
      {action && <div className="state__actions">{action}</div>}
    </div>
  );
}
