import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconSearch, IconFolder, IconLayoutDashboard, IconGitPullRequest, IconChartBar, IconSettings, IconUser } from '@tabler/icons-react';
import { listConnectedRepositories } from '../features/repositories/repositoriesApi.js';

const PAGES = [
  { id: 'p-dashboard', label: 'Dashboard', to: '/dashboard', Icon: IconLayoutDashboard },
  { id: 'p-repositories', label: 'Repositories', to: '/repositories', Icon: IconFolder },
  { id: 'p-reviews', label: 'Reviews', to: '/reviews', Icon: IconGitPullRequest },
  { id: 'p-analytics', label: 'Analytics', to: '/analytics', Icon: IconChartBar },
  { id: 'p-settings', label: 'Settings', to: '/settings', Icon: IconSettings },
  { id: 'p-profile', label: 'Profile', to: '/profile', Icon: IconUser },
];

/**
 * "Jump to" palette: navigates to app pages and to connected repositories
 * (data comes from the existing repositories endpoint; nothing new on the backend).
 * Built on the native <dialog> element, which supplies the focus trap,
 * Escape-to-close and focus restoration.
 */
export default function CommandPalette({ open, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const reposQuery = useQuery({
    queryKey: ['repositories', 'connected'],
    queryFn: listConnectedRepositories,
    enabled: open,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery('');
      setActive(0);
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const items = useMemo(() => {
    const repoItems = (reposQuery.data ?? []).map((repo) => ({
      id: `r-${repo.id}`,
      label: repo.fullName,
      to: `/repositories/${repo.id}`,
      Icon: IconFolder,
      mono: true,
      group: 'Repositories',
    }));
    const all = [...PAGES.map((p) => ({ ...p, group: 'Pages' })), ...repoItems];
    const q = query.trim().toLowerCase();
    return q ? all.filter((item) => item.label.toLowerCase().includes(q)) : all;
  }, [reposQuery.data, query]);

  useEffect(() => setActive(0), [query]);

  const choose = (item) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && items[active]) {
      event.preventDefault();
      choose(items[active]);
    }
  };

  useEffect(() => {
    document.getElementById(`cmd-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label="Jump to"
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
    >
      <div className="palette__search">
        <IconSearch size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Jump to a page or repository…"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmd-list"
          aria-activedescendant={items[active] ? `cmd-opt-${active}` : undefined}
          aria-label="Jump to a page or repository"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd>Esc</kbd>
      </div>

      <ul id="cmd-list" role="listbox" aria-label="Results" className="palette__list">
        {items.map((item, i) => (
          <li
            key={item.id}
            id={`cmd-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className={`palette__item${i === active ? ' is-active' : ''}`}
            onMouseMove={() => setActive(i)}
            onClick={() => choose(item)}
          >
            <item.Icon size={16} aria-hidden="true" />
            <span className={item.mono ? 'mono' : undefined}>{item.label}</span>
            <span className="palette__group">{item.group}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="palette__empty" role="presentation">
            {reposQuery.isLoading ? 'Loading repositories…' : `Nothing matches “${query}”.`}
          </li>
        )}
      </ul>
    </dialog>
  );
}
