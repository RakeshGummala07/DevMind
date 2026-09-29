import { useEffect } from 'react';

const BASE = 'DevMind';

export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${BASE}` : `${BASE} — Ask your codebase questions it can actually answer`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
