/**
 * Voice Transcription Display Component
 * Shows the raw transcription output for testing and debugging
 */

import React from 'react';
import './VoiceTranscriptionDisplay.css';

interface TranscriptionEntry {
  id: string;
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

interface VoiceTranscriptionDisplayProps {
  entries: TranscriptionEntry[];
  onClear?: () => void;
}

export const VoiceTranscriptionDisplay: React.FC<VoiceTranscriptionDisplayProps> = ({
  entries,
  onClear,
}) => {
  if (entries.length === 0) {
    return (
      <div className="transcription-display empty">
        <div className="transcription-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="empty-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p>Click the microphone button to start speaking</p>
          <p className="hint">Your words will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-display">
      <div className="transcription-header">
        <h3>Voice Transcription</h3>
        {onClear && (
          <button className="clear-button" onClick={onClear} title="Clear transcription">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
      
      <div className="transcription-entries">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`transcription-entry ${entry.isFinal ? 'final' : 'interim'}`}
          >
            <div className="entry-content">
              <span className="entry-transcript">{entry.transcript}</span>
              <span className={`entry-badge ${entry.isFinal ? 'final' : 'interim'}`}>
                {entry.isFinal ? 'Final' : 'Interim'}
              </span>
            </div>
            
            <div className="entry-metadata">
              <span className="entry-confidence">
                Confidence: {(entry.confidence * 100).toFixed(0)}%
              </span>
              <span className="entry-timestamp">
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};