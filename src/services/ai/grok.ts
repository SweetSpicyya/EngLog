import { checkOpenAICompat, callOpenAICompat } from './openaiCompat';

const BASE = 'https://api.x.ai/v1';

export const checkGrok = (apiKey: string) => checkOpenAICompat(BASE, apiKey);
export const callGrok  = (apiKey: string, system: string, user: string) =>
  callOpenAICompat(BASE, 'grok-3-latest', apiKey, system, user);
