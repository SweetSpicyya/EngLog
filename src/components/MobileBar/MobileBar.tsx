import './MobileBar.css';

interface MobileBarProps {
  providerLabel: string;
  onNewEntry: () => void;
  onSettings: () => void;
}

export function MobileBar({ providerLabel, onNewEntry, onSettings }: MobileBarProps) {
  return (
    <div className="mobile-bar">
      <span className="mobile-logo">daylog</span>
      <div className="mobile-bar-actions">
        <span className="provider-pill">{providerLabel}</span>
        <button className="mobile-icon-btn" onClick={onNewEntry} title="new entry">＋</button>
        <button className="mobile-icon-btn" onClick={onSettings} title="settings">⚙</button>
      </div>
    </div>
  );
}
