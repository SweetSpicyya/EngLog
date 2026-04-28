import type { DiaryEntry } from '../types';

const FOLDER_NAME = 'daylog';
let folderId: string | null = null;

async function getOrCreateFolder(token: string): Promise<string> {
  if (folderId) return folderId;
  const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name%3D'${FOLDER_NAME}'+and+mimeType%3D'application%2Fvnd.google-apps.folder'+and+trashed%3Dfalse`,
      { headers: { Authorization: 'Bearer ' + token } }
  );
  const data = await res.json();

  if (data.files?.length) {
    folderId = data.files[data.files.length - 1].id;
    return folderId!;
  }

  const cr = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  folderId = (await cr.json()).id;
  return folderId!;
}

export async function saveEntry(token: string, dateKey: string, content: DiaryEntry, existingFileId?: string): Promise<string> {
  const folder = await getOrCreateFolder(token);
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  if (existingFileId) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: blob,
    });
    return existingFileId;
  }
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: dateKey + '.json', parents: [folder] })], { type: 'application/json' }));
  form.append('file', blob);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
  });
  return (await res.json()).id;
}

export async function loadAllEntries(token: string): Promise<Record<string, DiaryEntry>> {
  const folder = await getOrCreateFolder(token);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folder}'+in+parents+and+trashed=false&fields=files(id,name)&orderBy=name+desc`,
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const files = (await res.json()).files ?? [];
  const result: Record<string, DiaryEntry> = {};
  for (const f of files) {
    const key = (f.name as string).replace('.json', '');
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    try { result[key] = { ...await fileRes.json(), fileId: f.id }; } catch { /* skip */ }
  }
  return result;
}
