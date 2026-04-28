export type AIProvider = 'claude' | 'openai' | 'gemini' | 'grok';

export interface Config {
  provider: AIProvider;
  apiKey: string;
  clientId: string;
}

export interface DiaryEntry {
  title: string;
  originalBody: string;
  fixedBody: CorrectionResult;
  advancedBody: string;
  savedAt: string;
  fileId?: string;
}

export interface Entries {
  [dateKey: string]: DiaryEntry;
}

export interface CorrectionNote {
  from: string;
  to: string;
  why: string;
}

export interface CorrectionResult {
  corrected: string;
  notes: CorrectionNote[] | string;
}

export const PROVIDERS: Record<AIProvider, { label: string }> = {
  claude:  { label: 'Claude'  },
  openai:  { label: 'GPT-4o'  },
  gemini:  { label: 'Gemini'  },
  grok:    { label: 'Grok'    },
};
