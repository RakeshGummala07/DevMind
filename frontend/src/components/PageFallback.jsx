import TraceLine from './TraceLine.jsx';

export default function PageFallback({ inline = false }) {
  return (
    <div className={inline ? 'page-fallback page-fallback--inline' : 'center-screen'}>
      <div className="trace-slot">
        <TraceLine active tone="ember" label="Loading page" />
      </div>
    </div>
  );
}
