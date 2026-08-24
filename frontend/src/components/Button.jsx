import { motion } from 'framer-motion';
import { durations, ease } from '../utils/motionTokens.js';

const VARIANTS = {
  primary: { background: 'var(--ember)', color: '#1a0e05', border: '1px solid var(--ember)' },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  },
};

export default function Button({ children, variant = 'primary', onClick, type = 'button', style }) {
  const variantStyle = VARIANTS[variant];
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: durations.micro, ease }}
      style={{
        ...variantStyle,
        padding: '10px 18px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
