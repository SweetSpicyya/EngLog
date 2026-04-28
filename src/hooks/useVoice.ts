import { useRef, useState, useCallback } from 'react';

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

  const start = useCallback((target: 'body' | 'reBody' | null) => {
    setRecordingTarget(target);
    recordingTargetRef.current = target;
    rawFinalRef.current = '';
    committedRef.current = '';
    baseSnapshotRef.current = getBase();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;

    const rec: SpeechRecognitionInstance = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const raw = e.results[i][0].transcript;
          rawFinalRef.current += raw + ' ';  // 전체 세션 누적

          let str = raw.charAt(0).toUpperCase() + raw.slice(1);
          str = str.endsWith('?') || str.endsWith('!') ? str : str + '. ';
          committedRef.current += str;
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
      if (isRecordingRef.current && recognitionRef.current === rec) {
        baseSnapshotRef.current = baseSnapshotRef.current + committedRef.current;
        committedRef.current = '';
        try {
          rec.start();
        } catch {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      } else {
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    };

    rec.start();
    recognitionRef.current = rec;
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