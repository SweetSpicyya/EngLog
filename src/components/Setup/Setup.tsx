import { useState } from 'react';
import type { Config, AIProvider } from '../../types';
import { PROVIDERS } from '../../types';
import './Setup.css';
import {checkAI} from "../../services/ai";

interface SetupProps {
  onComplete: (cfg: Config) => void;
}

const PROVIDER_HINTS: Record<AIProvider, { placeholder: string; link: string; linkLabel: string }> = {
  claude: { placeholder: 'sk-ant-...', link: 'https://console.anthropic.com/', linkLabel: 'console.anthropic.com' },
  openai: { placeholder: 'sk-...', link: 'https://platform.openai.com/api-keys', linkLabel: 'platform.openai.com' },
  gemini: { placeholder: 'AIza...', link: 'https://aistudio.google.com/app/apikey', linkLabel: 'aistudio.google.com' },
  grok:   { placeholder: 'xai-...', link: 'https://console.x.ai/', linkLabel: 'console.x.ai' },
};

export function Setup({ onComplete }: SetupProps) {
  const [provider, setProvider] = useState<AIProvider | ''>('');
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  async function handleSubmit() {
    if (!provider) return alert('Select an AI provider');
    if (!apiKey.trim()) return alert('Enter your API key');
    if (!clientId.trim()) return alert('Enter your Google OAuth Client ID');

    setValidating(true);
    setValidationError('');

    const error = await validateKeys(provider, apiKey, clientId);

    if (error) {
      setValidationError(error);
      setValidating(false);
      return;
    }

    localStorage.setItem('englog_provider', provider);
    localStorage.setItem('englog_key_' + provider, apiKey);
    localStorage.setItem('englog_client_id', clientId);
    onComplete({ provider, apiKey, clientId });
    setValidating(false);
  }

  async function validateKeys(provider: AIProvider, apiKey: string, clientId: string): Promise<string | null> {
    const isValidAI = await checkAI(provider, apiKey);
    if(!isValidAI){
      return 'API key validation failed. Check your network or key.';
    }
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      return 'Google Client ID format invalid.';
    }

    return null;
  }

  const hint = provider ? PROVIDER_HINTS[provider] : null;

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">EngLog</div>
        <div className="setup-sub">your daily english diary</div>

        <div className="setup-group">
          <div className="setup-group-title">AI Provider</div>
          <div className="field">
            <label>choose your AI</label>
            <select value={provider} onChange={e => { setProvider(e.target.value as AIProvider); setApiKey(''); }}>
              <option value="">— select —</option>
              {(Object.keys(PROVIDERS) as AIProvider[]).map(p => (
                <option key={p} value={p}>{PROVIDERS[p].label}</option>
              ))}
            </select>
          </div>
          {hint && (
            <div className="field">
              <label>API Key</label>
              <input type="password" placeholder={hint.placeholder} value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <div className="field-hint">
                <a href={hint.link} target="_blank" rel="noreferrer">{hint.linkLabel}</a> → API Keys
              </div>
            </div>
          )}
        </div>

        <div className="setup-group">
          <div className="setup-group-title">Google Drive</div>
          <div className="field">
            <label>OAuth Client ID</label>
            <input type="text" placeholder="xxxx.apps.googleusercontent.com" value={clientId} onChange={e => setClientId(e.target.value)} />
            <div className="field-hint">
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Google Cloud Console</a> → APIs & Services → Credentials → OAuth 2.0 Client ID
            </div>
          </div>
        </div>

        {validationError && (
            <div className="validation-error">{validationError}</div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={validating}>
          {validating ? <><span className="spin" /> validating...</> : 'start writing →'}
        </button>
      </div>

    </div>
  );
}
