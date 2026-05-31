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

  // 녹음 시작 시점의 원본 텍스트 — onStop의 base로 사용 (절대 변경 안 됨)
  const startSnapshotRef = useRef('');
  // 세션 재시작 시 이전 세션 committed 텍스트를 누적하는 display용 base
  const baseSnapshotRef = useRef('');
  // 현재 세션의 simple-punc 결과 (매 onresult마다 index 0부터 rebuild)
  const committedRef = useRef('');
  // 완료된 세션들의 raw 텍스트 누적
  const rawAccumulatedRef = useRef('');
  // 현재 세션의 raw 텍스트 (매 onresult마다 rebuild)
  const sessionRawRef = useRef('');

  const startSessionRef = useRef<() => void>(() => {});

  const start = useCallback((target: 'body' | 'reBody' | null) => {
    setRecordingTarget(target);
    recordingTargetRef.current = target;

    const base = getBase();
    startSnapshotRef.current = base;
    baseSnapshotRef.current = base;
    committedRef.current = '';
    rawAccumulatedRef.current = '';
    sessionRawRef.current = '';

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;

    const startSession = () => {
      const rec: SpeechRecognitionInstance = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: SpeechRecognitionEvent) => {
        // 모바일에서 같은 index가 점진적으로 업데이트되므로
        // index 0부터 전체 rebuild — append 방식은 중복 발생
        let committed = '';
        let sessionRaw = '';
        let interim = '';

        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            committed += formatSentence(e.results[i][0].transcript);
            sessionRaw += e.results[i][0].transcript + ' ';
          } else {
            interim = e.results[i][0].transcript; // 마지막 interim만 사용
          }
        }

        committedRef.current = committed;
        sessionRawRef.current = sessionRaw;
        onTranscript(baseSnapshotRef.current + committedRef.current + interim);
      };

      rec.onerror = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
      };

      rec.onend = () => {
        if (isRecordingRef.current) {
          // 현재 세션 raw를 누적하고 display base 업데이트
          rawAccumulatedRef.current += sessionRawRef.current;
          sessionRawRef.current = '';
          baseSnapshotRef.current = baseSnapshotRef.current + committedRef.current;
          committedRef.current = '';
          // 새 인스턴스로 재시작
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

    // 완료된 세션 + 현재 세션 raw 합산
    const allRaw = (rawAccumulatedRef.current + sessionRawRef.current).trim();
    // base는 녹음 시작 시점의 원본 텍스트만 (중복 방지)
    if (onStop) onStop(allRaw, target, startSnapshotRef.current);
  }, [onStop]);

  const toggle = useCallback((target: 'body' | 'reBody' | null) => {
    isRecording ? stop() : start(target);
  }, [isRecording, start, stop]);

  return { isRecording, recordingTarget, toggle };
}
