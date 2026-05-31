import { checkOpenAICompat, callOpenAICompat } from './openaiCompat';

const BASE = 'https://api.openai.com/v1';

export const checkOpenAI = (apiKey: string) => checkOpenAICompat(BASE, apiKey);
export const callOpenAI  = (apiKey: string, system: string, user: string) =>
  callOpenAICompat(BASE, 'gpt-4o', apiKey, system, user);
