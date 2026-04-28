export function todayKey(): string {
  const offset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - offset).toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  const MS_PER_DAY = 86400000;
  const offset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - MS_PER_DAY - offset).toISOString().slice(0, 10);
}

export function formatDate(key: string): string {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSentence(str: string): string {
  str = str.trim();
  str = str.charAt(0).toUpperCase() + str.slice(1);
  str = str.endsWith('?') || str.endsWith('!') ? str : str + '. ';
  return str;
}
