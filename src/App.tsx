import { useState, useEffect, useCallback } from 'react';
import { Setup } from './components/Setup/Setup';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Editor } from './components/Editor/Editor';
import { MobileBar } from './components/MobileBar/MobileBar';
import { useDrive } from './hooks/useDrive';
import type { Config, AIProvider, CorrectionResult } from './types';
import { PROVIDERS } from './types';
import { todayKey } from './utils/date';
import './App.css';

function loadConfig(): Config | null {
  const provider = localStorage.getItem('daylog_provider') as AIProvider | null;
  const clientId = localStorage.getItem('daylog_client_id');
  if (!provider || !clientId) return null;
  const apiKey = localStorage.getItem('daylog_key_' + provider);
  if (!apiKey) return null;
  return { provider, apiKey, clientId };
}

export default function App() {
  const [cfg, setCfg] = useState<Config | null>(loadConfig);
  const [currentDate, setCurrentDate] = useState(todayKey);
  const [showSettings, setShowSettings] = useState(false);
  const [sProvider, setSProvider] = useState<AIProvider>('claude');
  const [sApiKey, setSApiKey] = useState('');
  const [sClientId, setSClientId] = useState('');

  const drive = useDrive(cfg?.clientId ?? '');

  useEffect(() => {
    if (cfg) drive.init();
  }, [cfg?.clientId]);

  const handleSave = useCallback(async (title: string, originalBody: string, fixedBody: CorrectionResult, advancedBody: string) => {
    if (!cfg) return;
    await drive.save(currentDate, { title, originalBody, fixedBody, advancedBody, savedAt: new Date().toISOString() });
  }, [cfg, currentDate, drive.save]);

  function openSettings() {
    if (!cfg) return;
    setSProvider(cfg.provider);
    setSApiKey(cfg.apiKey);
    setSClientId(cfg.clientId);
    setShowSettings(true);
  }

  function saveSettings() {
    localStorage.setItem('daylog_provider', sProvider);
    localStorage.setItem('daylog_key_' + sProvider, sApiKey);
    localStorage.setItem('daylog_client_id', sClientId);
    setCfg({ provider: sProvider, apiKey: sApiKey, clientId: sClientId });
    setShowSettings(false);
  }

  if (!cfg) return <Setup onComplete={setCfg} />;

  const current = drive.entries[currentDate];

  return (
    <div className="app">
      <MobileBar
        providerLabel={PROVIDERS[cfg.provider].label}
        onNewEntry={() => setCurrentDate(todayKey())}
        onSettings={openSettings}
      />
      <div className="layout">
        <Sidebar
          entries={drive.entries}
          currentDate={currentDate}
          cfg={cfg}
          onNewEntry={() => setCurrentDate(todayKey())}
          onSelectEntry={setCurrentDate}
          onSettings={openSettings}
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
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">⚙ settings</div>
            <div className="field">
              <label>AI provider</label>
              <select value={sProvider} onChange={e => setSProvider(e.target.value as AIProvider)}>
                {(Object.keys(PROVIDERS) as AIProvider[]).map(p => (
                  <option key={p} value={p}>{PROVIDERS[p].label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>API Key</label>
              <input type="password" value={sApiKey} onChange={e => setSApiKey(e.target.value)} />
            </div>
            <div className="field">
              <label>OAuth Client ID</label>
              <input type="text" value={sClientId} onChange={e => setSClientId(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={saveSettings}>save</button>
              <button className="btn-ghost" onClick={() => setShowSettings(false)}>cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
