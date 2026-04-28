import type { AIProvider } from '../../types';
import { callClaude } from './claude';
import { callOpenAI } from './openai';
import { callGemini } from './gemini';
import { callGrok } from './grok';

export const FIX_SYSTEM =
    `You are an English writing coach. The user writes diary entries in Korean or broken English.
      Your job:
      1. Produce a natural, corrected English version.
      2. List 2-4 correction notes.
      
      Respond ONLY in this exact JSON format (no markdown fences, no extra text):
      {"corrected":"corrected text here","notes":[{"from":"original phrase","to":"corrected phrase","why":"short reason"}]}`;

export const PUNCTUATE_SYSTEM =
    `You are a punctuation formatter for speech-to-text transcripts.
      Your ONLY job is to add punctuation marks (periods, commas, question marks) and fix capitalization.
      DO NOT change, rephrase, add, or remove any words.
      DO NOT correct grammar or improve the text.
      Return ONLY the punctuated text, nothing else.`;

export async function callAI(provider: AIProvider, apiKey: string, system: string, user: string): Promise<string> {
  switch (provider) {
    case 'claude': return callClaude(apiKey, system, user);
    case 'openai': return callOpenAI(apiKey, system, user);
    case 'gemini': return callGemini(apiKey, system, user);
    case 'grok':   return callGrok(apiKey, system, user);
    default: throw new Error('Unknown provider: ' + provider);
  }
}
