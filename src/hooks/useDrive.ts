import { useRef, useState, useCallback } from 'react';
import { loadAllEntries, saveEntry } from '../services/drive';
import type { DiaryEntry, Entries } from '../types';

declare const google: any;

export function useDrive(clientId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entries>({});
  const tokenClientRef = useRef<any>(null);

  const init = useCallback(() => {
    if (!clientId) return;

    const setup = () => {
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (resp: any) => {
          if (resp.error) return;
          setToken(resp.access_token);
          const loaded = await loadAllEntries(resp.access_token);
          setEntries(loaded);
        },
      });
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    };

    if (typeof google !== 'undefined') {
      setup();
    } else {
      const interval = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(interval);
          setup();
        }
      }, 100);
    }
  }, [clientId]);

  const requireAuth = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (token) { resolve(token); return; }
      const orig = tokenClientRef.current.callback;
      tokenClientRef.current.callback = (resp: any) => {
        orig(resp);
        resp.error ? reject(resp.error) : resolve(resp.access_token);
      };
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    });
  }, [token]);

  const save = useCallback(async (dateKey: string, content: DiaryEntry): Promise<void> => {
    const t = await requireAuth();
    const existingFileId = entries[dateKey]?.fileId;
    if (existingFileId) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${existingFileId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + t }
      });
    }

    const fileId = await saveEntry(t, dateKey, content, undefined);
    setEntries(prev => ({ ...prev, [dateKey]: { ...content, fileId } }));
  }, [requireAuth, entries]);

  return { token, entries, init, save };
}
