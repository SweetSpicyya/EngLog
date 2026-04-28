import { useState } from 'react';
import type { CorrectionResult, CorrectionNote } from '../../types';
import './CorrectionPanel.css';

interface CorrectionPanelProps {
    result: CorrectionResult;
    providerLabel: string;
}

export function CorrectionPanel({ result, providerLabel }: CorrectionPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const notes = Array.isArray(result.notes) ? result.notes as CorrectionNote[] : [];

    return (
        <div className="correction">
            <div className="correction-head">
                <span className="correction-head-title">ai correction</span>
                <span className="ai-badge">{providerLabel}</span>
            </div>
            <div className="correction-body">
                <div className="corrected-text">{result.corrected}</div>
                <div className="open-correction-note" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? 'Hide Correction Note ▲' : 'Show Correction Note ▼'}
                </div>
                {isOpen && (
                    <div className="note-card-list">
                        {notes.map((note, i) => (
                            <div className="note-card" key={i}>
                                <div className="note-card-top">
                                    <span className="note-num">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="note-change">
                    <span className="from">{note.from}</span>
                    <span className="arrow">→</span>
                    <span className="to">{note.to}</span>
                  </span>
                                </div>
                                <div className="note-why">{note.why}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}