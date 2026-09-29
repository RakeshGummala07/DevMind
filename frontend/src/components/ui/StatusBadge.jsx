import Badge from './Badge.jsx';

// Indexing lifecycle of a repository (values come from repository-service).
export const INDEX_STATUS = {
  IDLE: { label: 'Not indexed', tone: 'neutral' },
  INDEXING: { label: 'Indexing…', tone: 'ember', pulse: true },
  COMPLETED: { label: 'Indexed', tone: 'signal' },
  FAILED: { label: 'Indexing failed', tone: 'critical' },
};

export default function StatusBadge({ status }) {
  const s = INDEX_STATUS[status] ?? INDEX_STATUS.IDLE;
  return (
    <Badge tone={s.tone} dot pulse={s.pulse}>
      {s.label}
    </Badge>
  );
}
