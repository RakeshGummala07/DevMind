import { motion } from 'framer-motion';
import { fadeUp, transitions } from '../utils/motionTokens.js';

export default function PageContainer({ children, style }) {
  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={transitions.page}
      style={{ padding: '32px 40px', ...style }}
    >
      {children}
    </motion.div>
  );
}
