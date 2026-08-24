// Single source of truth for animation timing. Every motion.* component in
// the app should pull its transition values from here rather than inventing
// its own — that consistency is what makes the UI feel orchestrated instead
// of like a pile of individually-animated widgets.

export const durations = {
  micro: 0.2, // hover, toggle, status-pill state change
  base: 0.35, // card entrance, list item, chat bubble
  page: 0.45, // route / tab transitions
};

export const ease = [0.16, 1, 0.3, 1]; // easeOutExpo-ish — used everywhere, no exceptions

export const stagger = {
  list: 0.04, // search results, PR findings
  dashboard: 0.06, // dashboard cards on first load
};

// Common transition presets, ready to spread into a `transition` prop.
export const transitions = {
  micro: { duration: durations.micro, ease },
  base: { duration: durations.base, ease },
  page: { duration: durations.page, ease },
};

// Common variant presets for the most-repeated motion patterns.
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
