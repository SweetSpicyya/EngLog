import type { Entries, Config } from '../../types';
import { PROVIDERS } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  entries: Entries;
  currentDate: string;
  cfg: Config;
  onNewEntry: () => void;
  onSelectEntry: (key: string) => void;
  onSettings: () => void;
}

export function Sidebar({ entries, currentDate, cfg, onNewEntry, onSelectEntry, onSettings }: SidebarProps) {
  const sorted = Object.keys(entries).sort().reverse();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">EngLog</div>
      <button className="new-btn" onClick={onNewEntry}>+ new entry</button>
      <div className="sidebar-label">entries</div>
      <div className="entries-list">
        {sorted.map(key => (
          <div key={key} className={`entry-row ${key === currentDate ? 'active' : ''}`} onClick={() => onSelectEntry(key)}>
            <div className="entry-row-date">{key}</div>
            <div className="entry-row-preview">{entries[key].title || entries[key].body?.slice(0, 28) || '—'}</div>
          </div>
        ))}
      </div>
      <div className="sidebar-foot">
        <span className="provider-pill">{PROVIDERS[cfg.provider].label}</span>
        <button className="foot-btn" onClick={onSettings}>⚙ settings</button>
      </div>
    </aside>
  );
}
