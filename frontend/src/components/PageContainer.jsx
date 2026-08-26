import { motion } from 'framer-motion';
import { fadeUp, transitions } from '../utils/motionTokens.js';

export default function PageContainer({ children, style, className = '' }) {
  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={transitions.page}
      className={`page-container ${className}`.trim()}
      style={style}
    >
      {children}
    </motion.div>
  );
}
