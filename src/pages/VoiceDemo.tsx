import React, { useState } from 'react';
import { VoiceButton } from '../components/VoiceButton';
import { VoiceTranscriptionDisplay } from '../components/VoiceTranscriptionDisplay';
import './VoiceDemo.css';

interface TranscriptionEntry {
  id: string;
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export const VoiceDemo: React.FC = () => {
  const [entries, setEntries] = useState<TranscriptionEntry[]>([]);

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    const newEntry: TranscriptionEntry = {
      id: `${Date.now()}-${Math.random()}`,
      transcript,
      confidence: 0.95,
      isFinal,
      timestamp: new Date(),
    };

    if (isFinal) {
      setEntries(prev => [...prev, newEntry]);
    } else {
      setEntries(prev => {
        const withoutInterim = prev.filter(e => e.isFinal);
        return [...withoutInterim, newEntry];
      });
    }
  };

  const handleClear = () => {
    setEntries([]);
  };

  return (
    <div className="voice-demo-page">
      <div className="voice-demo-container">
        <header className="voice-demo-header">
          <h1>Voice Input Demo</h1>
          <p className="subtitle">Phase 1: Foundation & Proof of Concept</p>
        </header>

        <div className="demo-section">
          <div className="demo-card">
            <h2>Try Voice Input</h2>
            <p className="demo-instructions">
              Click the microphone button below and start speaking. 
              Your words will appear in real-time in the transcription display.
            </p>
            <VoiceButton onTranscript={handleTranscript} />
          </div>

          <div className="demo-card">
            <VoiceTranscriptionDisplay entries={entries} onClear={handleClear} />
          </div>

          <div className="demo-card info-card">
            <h3>Browser Compatibility</h3>
            <ul>
              <li>✅ Chrome (recommended)</li>
              <li>✅ Edge</li>
              <li>✅ Safari</li>
              <li>❌ Firefox (limited support)</li>
            </ul>
          </div>

          <div className="demo-card info-card">
            <h3>Phase 1 Features</h3>
            <ul>
              <li>✅ Microphone permission handling</li>
              <li>✅ Real-time voice transcription</li>
              <li>✅ Interim and final results</li>
              <li>✅ Visual feedback (listening state)</li>
              <li>✅ Error handling</li>
            </ul>
          </div>

          <div className="demo-card info-card">
            <h3>Coming in Phase 2</h3>
            <ul>
              <li>🔜 Number recognition (five → 5)</li>
              <li>🔜 Basic math operations</li>
              <li>🔜 Calculator integration</li>
              <li>🔜 Auto-execution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};