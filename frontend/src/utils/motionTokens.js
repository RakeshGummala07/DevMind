// Single source of truth for animation timing. Every motion component in the
// app pulls its transition values from here rather than inventing its own —
// that consistency is what makes the UI feel orchestrated instead of like a
// pile of individually-animated widgets.

export const durations = {
  micro: 0.18, // hover, toggle, status-pill state change
  base: 0.32, // card entrance, list item, chat bubble
  page: 0.42, // route / tab transitions
};

export const ease = [0.16, 1, 0.3, 1]; // easeOutExpo-ish — used everywhere

export const stagger = {
  list: 0.04, // search results, PR findings
  dashboard: 0.06, // dashboard cards on first load
};

export const transitions = {
  micro: { duration: durations.micro, ease },
  base: { duration: durations.base, ease },
  page: { duration: durations.page, ease },
};

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const staggerContainer = (staggerAmount = stagger.list) => ({
  animate: {
    transition: { staggerChildren: staggerAmount },
  },
});

// Scroll-reveal props for marketing sections: play once, only a small offset.
export const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: transitions.page,
};
