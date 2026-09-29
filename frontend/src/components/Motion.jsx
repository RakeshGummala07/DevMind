import { LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion';

/**
 * App-wide motion setup.
 *  - LazyMotion (strict): only the light "domAnimation" feature set is loaded,
 *    which is why every animated element in the codebase uses `m.*`.
 *  - MotionConfig reducedMotion="user": transform/layout animations are
 *    disabled automatically for people who enable `prefers-reduced-motion`.
 */
export function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export { m };
