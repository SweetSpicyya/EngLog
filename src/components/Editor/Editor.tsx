import {useEffect, useRef, useState} from 'react';
import { CorrectionPanel } from '../CorrectionPanel/CorrectionPanel';
import { useVoice } from '../../hooks/useVoice';
import { useAI } from '../../hooks/useAI';
import type { Config } from '../../types';
import { PROVIDERS } from '../../types';
import {formatDate, yesterdayKey} from '../../utils/date';
import type{ CorrectionResult } from '../../types';
import './Editor.css';

interface EditorProps {
  cfg: Config;
  currentDate: string;
  initialTitle: string;
  initialOriginalBody: string;
  initialFixedBody: CorrectionResult;
  initialAdvancedBody: string;
  onSave: (title: string, body: string, correction: CorrectionResult, reBody: string) => Promise<void>;
}

export function Editor({ cfg, currentDate, initialTitle, initialOriginalBody, initialFixedBody, initialAdvancedBody, onSave }: EditorProps) {
  const [selectedDate, setSelectedDate] = useState(formatDate(currentDate));
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody]   = useState(initialOriginalBody);
  const [correction, setCorrection] = useState(initialFixedBody);
  const [reBody, setReBody] = useState(initialAdvancedBody);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const reBodyRef = useRef<HTMLTextAreaElement>(null);
  const targetRef = useRef<'body' | 'reBody'>('body');
  const ai = useAI(cfg.provider, cfg.apiKey);

  useEffect(() => {
    if (ai.result) {
      setCorrection(ai.result);
    }
  }, [ai.result]);


  const formatted = (fullText: string) => {
    return fullText.
    replace(/([.!?,])(\S)/g, '$1 $2')
        .replace(/([.!?,])\s{2,}/g, '$1 ');
  }

  const join = (base: string, corrected: string) => {
    if (!base) return formatted(corrected);
    return formatted(base.trimEnd() + ' ' + corrected);
  };


  const voice = useVoice({
    onTranscript: (text) => {
      if (targetRef.current === 'body') setBody(text);
      else setReBody(text);
    },
    getBase: () => {
      if (targetRef.current === 'body') return bodyRef.current?.value ?? body;
      else return reBodyRef.current?.value ?? reBody;
    },
    onStop: (finalText, target, base) => {
      ai.punctuate(finalText, target, (corrected) => {
        if (target === 'body') setBody(join(base, corrected));
        else setReBody(join(base, corrected));
      });
    }
  });

  async function handleSave() {
    if (!body.trim() || !reBody.trim() || !ai.result || !title) {
      setSaving(false);
      setSaveMsg('Save failed! You can save after completing all steps or put the title.')
      return;
    }

    setSaving(true);
    setSaveMsg('Saving...');
    try {
      await onSave(title, body, ai.result!, reBody);
      setSaveMsg('Saved ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
    }
  }

  const getVoiceBtnContent = (target: 'body' | 'reBody') => {
    const isCurrentTarget = voice.recordingTarget === target;

    if (isCurrentTarget && ai.punctuating) {
      return <><span>✎</span> Punctuating...</>;
    }
    if (isCurrentTarget && voice.isRecording) {
      return <><span className="rec-dot"/> recording</>;
    }

    return target === 'body'
        ? <><span>◉</span> Record Log</>
        : <><span>↻</span> Re-record Log</>;
  };

  return (
      <main className="editor">
        <div className={"date-container"}>
          <button className={"date-change-btn"} onClick={() => setSelectedDate(formatDate(yesterdayKey()))}> ᐊ</button>
          <div className="editor-date-label">{selectedDate}</div>
          <button className={"date-change-btn"} onClick={() => setSelectedDate(formatDate(currentDate))}>↻</button>
        </div>
        <input className="title-input" type="text" placeholder="Today's title..." value={title}
               onChange={e => setTitle(e.target.value)}/>

        <div className="toolbar">
          <div className="toolbar-step">
            <span className={`step-label ${body ? 'done' : ''}`}>step 1</span>
            <button className={`tbtn ${voice.recordingTarget === 'body' ? 'recording' : ''}`} onClick={() => {
              targetRef.current = 'body';
              voice.toggle('body');
            }}>
              {getVoiceBtnContent('body')}
            </button>
          </div>

          <div className="toolbar-step">
            <span
                className={`step-label ${ai.result && ai.result!.corrected !== 'nothing' ? 'done' : ''}`}>step 2</span>
            <button className={`tbtn ${ai.loading ? 'ai-active' : ''}`} onClick={() => ai.fix(body)}
                    disabled={ai.loading}>
              {ai.loading ? <><span className="spin"/> fixing</> : <><span>✦</span> AI fix</>}
            </button>
          </div>


          <div className="toolbar-step">
            <span className={`step-label ${reBody ? 'done' : ''}`}>step 3</span>
            <button className={`tbtn ${voice.recordingTarget === 'reBody' ? 'recording' : ''}`} onClick={() => {
              targetRef.current = 'reBody';
              voice.toggle('reBody');
            }}>
              {getVoiceBtnContent('reBody')}
            </button>
          </div>
        </div>

        <div className="textarea-wrapper">
          <textarea ref={bodyRef} className="body-textarea"
                    placeholder="Start writing... (English, voice or type)" value={body}
                    onChange={e => setBody(e.target.value)}/>
          {ai.punctuatingTarget === 'body' &&
              <div className="punctuating-overlay">
                <span className="spin"/> punctuating...
              </div>
          }
        </div>

        {ai.error && <div className="ai-error">AI error: {ai.error}</div>}

        {correction && correction.corrected !== 'nothing' && (
            <CorrectionPanel
                result={correction}
                providerLabel={PROVIDERS[cfg.provider].label}
            />
        )}

        {ai.result && ai.result!.corrected === 'nothing' && (
            <div className={"ai-fix-nothing"}>Nothing to fix. Write your log.</div>
        )}


        <div className="textarea-wrapper">
          <textarea ref={reBodyRef} className="body-textarea"
                    placeholder="Re-writing... (English, voice or type)" value={reBody}
                    onChange={e => setReBody(e.target.value)}/>
          {ai.punctuatingTarget === 'reBody' &&
              <div className="punctuating-overlay">
                <span className="spin"/> punctuating...
              </div>
          }
        </div>

          <div className="save-bar">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spin"/> : 'save to drive'}
            </button>
            <span className={`status ${
                !saveMsg ? '' :
                    saveMsg.includes('failed') ? 'err' : saveMsg.includes('Saved') ? 'ok' : 'loading'
            }`}>
          {saveMsg}
        </span>
          </div>
      </main>
);
}
