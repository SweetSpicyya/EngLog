import './MobileBar.css';

interface MobileBarProps {
  onNewEntry: () => void;
  onSettings: () => void;
  onMenuToggle: () => void;
}

export function MobileBar({ onNewEntry, onSettings, onMenuToggle }: MobileBarProps) {
  return (
      <div className="mobile-bar">
          <span className="mobile-logo">EngLog</span>
          <div className="mobile-bar-actions">
              <button className="mobile-icon-btn" onClick={onMenuToggle}>☰</button>
              <button className="mobile-icon-btn" onClick={onNewEntry} title="new entry">＋</button>
              <button className="mobile-icon-btn" onClick={onSettings} title="settings">⚙</button>
          </div>
      </div>
  );
}
