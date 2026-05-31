import { useState, useCallback } from 'react';
import { callAI, FIX_SYSTEM, PUNCTUATE_SYSTEM } from '../services/ai';
import { callWithRetry } from '../utils/retry';
import type { AIProvider, CorrectionResult } from '../types';

export function useAI(provider: AIProvider, apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [punctuating, setPunctuating] = useState(false);
  const [punctuatingTarget, setPunctuatingTarget] = useState<'body' | 'reBody' | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fix = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult({ corrected: 'nothing', notes: 'nothing' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await callWithRetry(() => callAI(provider, apiKey, FIX_SYSTEM, text));
      const clean = raw.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey]);

  const punctuate = useCallback(async (text: string, target: 'body' | 'reBody', onDone: (result: string) => void) => {
    if (!text.trim()) return;
    setPunctuating(true);
    setPunctuatingTarget(target);
    try {
      const res = await callWithRetry(() => callAI(provider, apiKey, PUNCTUATE_SYSTEM, text));
      onDone(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPunctuating(false);
      setPunctuatingTarget(null);
    }
  }, [provider, apiKey]);

  return { loading, result, error, fix, punctuate, punctuating, punctuatingTarget };
}
