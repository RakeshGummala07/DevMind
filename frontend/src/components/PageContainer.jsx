import { m } from './Motion.jsx';
import { fadeUp, transitions } from '../utils/motionTokens.js';

/** `bare` renders a section without page padding (used inside RepositoryLayout, which already provides it). */
export default function PageContainer({ children, style, className = '', bare = false }) {
  return (
    <m.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={transitions.page}
      className={`${bare ? 'page-section' : 'page-container'} ${className}`.trim()}
      style={style}
    >
      {children}
    </m.div>
  );
}
