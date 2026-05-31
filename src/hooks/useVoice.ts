import { useRef, useState, useCallback } from 'react';
import { formatSentence } from '../utils/date';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface UseVoiceOptions {
  onTranscript: (text: string) => void;
  getBase: () => string;
  onStop: (finalText: string, target: 'body' | 'reBody', base: string) => void;
}

export function useVoice({ onTranscript, getBase, onStop }: UseVoiceOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTarget, setRecordingTarget] = useState<'body' | 'reBody' | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recordingTargetRef = useRef<'body' | 'reBody' | null>(null);
  const isRecordingRef = useRef(false);
  const rawFinalRef = useRef('');
  const committedRef = useRef('');
  const baseSnapshotRef = useRef('');
  const startSessionRef = useRef<() => void>(() => {});

  const start = useCallback((target: 'body' | 'reBody' | null) => {
    setRecordingTarget(target);
    recordingTargetRef.current = target;
    rawFinalRef.current = '';
    committedRef.current = '';
    baseSnapshotRef.current = getBase();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;

    const startSession = () => {
      const rec: SpeechRecognitionInstance = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const raw = e.results[i][0].transcript;
            rawFinalRef.current += raw + ' ';
            committedRef.current += formatSentence(raw);
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        onTranscript(baseSnapshotRef.current + committedRef.current + interim);
      };

      rec.onerror = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
      };

      rec.onend = () => {
        if (isRecordingRef.current) {
          // 이전 세션에서 확정된 텍스트를 base로 이동
          baseSnapshotRef.current = baseSnapshotRef.current + committedRef.current;
          committedRef.current = '';
          // 새 인스턴스로 재시작 (기존 인스턴스 재사용 시 모바일에서 결과 중복 발생)
          startSessionRef.current();
        } else {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    };

    startSessionRef.current = startSession;
    startSession();
    isRecordingRef.current = true;
    setIsRecording(true);
    return true;
  }, [getBase, onTranscript]);

  const stop = useCallback(() => {
    isRecordingRef.current = false;
    recognitionRef.current?.stop();
    const target = recordingTargetRef.current ?? 'body';
    recordingTargetRef.current = null;
    setRecordingTarget(null);
    setIsRecording(false);
    if (onStop) onStop(rawFinalRef.current.trim(), target, baseSnapshotRef.current);
  }, [onStop]);

  const toggle = useCallback((target: 'body' | 'reBody' | null) => {
    isRecording ? stop() : start(target);
  }, [isRecording, start, stop]);

  return { isRecording, recordingTarget, toggle };
}