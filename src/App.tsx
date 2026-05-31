import { useState, useEffect, useCallback } from 'react';
import { Setup } from './components/Setup/Setup';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Editor } from './components/Editor/Editor';
import { MobileBar } from './components/MobileBar/MobileBar';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { useDrive } from './hooks/useDrive';
import type { Config, AIProvider, CorrectionResult } from './types';
import { todayKey } from './utils/date';
import './App.css';

function loadConfig(): Config | null {
  const provider = localStorage.getItem('englog_provider') as AIProvider | null;
  const clientId = localStorage.getItem('englog_client_id');
  if (!provider || !clientId) return null;
  const apiKey = localStorage.getItem('englog_key_' + provider);
  if (!apiKey) return null;
  return { provider, apiKey, clientId };
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cfg, setCfg] = useState<Config | null>(loadConfig);
  const [currentDate, setCurrentDate] = useState(todayKey);
  const [showSettings, setShowSettings] = useState(false);

  const drive = useDrive(cfg?.clientId ?? '');

  useEffect(() => {
    if (cfg) drive.init();
  }, [cfg?.clientId]);

  const handleSave = useCallback(async (title: string, originalBody: string, fixedBody: CorrectionResult, advancedBody: string) => {
    if (!cfg) return;
    await drive.save(currentDate, { title, originalBody, fixedBody, advancedBody, savedAt: new Date().toISOString() });
  }, [cfg, currentDate, drive.save]);

  if (!cfg) return <Setup onComplete={setCfg} />;

  const current = drive.entries[currentDate];

  return (
    <div className="app">
      <MobileBar
        onNewEntry={() => setCurrentDate(todayKey())}
        onSettings={() => setShowSettings(true)}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
      />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar
          entries={drive.entries}
          currentDate={currentDate}
          cfg={cfg}
          onNewEntry={() => setCurrentDate(todayKey())}
          onSelectEntry={(key) => { setCurrentDate(key); setSidebarOpen(false); }}
          onSettings={() => setShowSettings(true)}
        />
        <Editor
          key={currentDate}
          cfg={cfg}
          currentDate={currentDate}
          initialTitle={current?.title ?? ''}
          initialOriginalBody={current?.originalBody ?? ''}
          initialFixedBody={current?.fixedBody ?? null}
          initialAdvancedBody={current?.advancedBody ?? ''}
          onSave={handleSave}
        />
      </div>

      {showSettings && (
        <SettingsModal
          cfg={cfg}
          onSave={(newCfg) => { setCfg(newCfg); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
