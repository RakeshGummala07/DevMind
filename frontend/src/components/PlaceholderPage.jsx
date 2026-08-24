import PageContainer from './PageContainer.jsx';
import TraceLine from './TraceLine.jsx';

export default function PlaceholderPage({ title, description, phase }) {
  return (
    <PageContainer>
      <h1 style={{ marginBottom: 4 }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, maxWidth: 520 }}>
        {description}
      </p>
      <div style={{ width: 240, marginBottom: 12 }}>
        <TraceLine active tone="signal" />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        wired up in {phase}
      </span>
    </PageContainer>
  );
}
