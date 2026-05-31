export function normalizeSpacing(text: string): string {
  return text
    .replace(/([.!?,])(\S)/g, '$1 $2')
    .replace(/([.!?,])\s{2,}/g, '$1 ');
}
