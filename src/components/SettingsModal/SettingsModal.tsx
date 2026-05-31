import { useState } from 'react';
import type { Config, AIProvider } from '../../types';
import { PROVIDERS } from '../../types';

interface SettingsModalProps {
  cfg: Config;
  onSave: (cfg: Config) => void;
  onClose: () => void;
}

export function SettingsModal({ cfg, onSave, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<AIProvider>(cfg.provider);
  const [apiKey, setApiKey] = useState(cfg.apiKey);
  const [clientId, setClientId] = useState(cfg.clientId);

  function handleSave() {
    localStorage.setItem('englog_provider', provider);
    localStorage.setItem('englog_key_' + provider, apiKey);
    localStorage.setItem('englog_client_id', clientId);
    onSave({ provider, apiKey, clientId });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⚙ settings</div>
        <div className="field">
          <label>AI provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value as AIProvider)}>
            {(Object.keys(PROVIDERS) as AIProvider[]).map(p => (
              <option key={p} value={p}>{PROVIDERS[p].label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} />
        </div>
        <div className="field">
          <label>OAuth Client ID</label>
          <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={handleSave}>save</button>
          <button className="btn-ghost" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  );
}
