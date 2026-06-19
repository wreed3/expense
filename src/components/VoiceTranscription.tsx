import React from 'react';

interface VoiceTranscriptionProps {
  transcript: string;
  isFinal: boolean;
  isListening: boolean;
  className?: string;
}

const VoiceTranscription: React.FC<VoiceTranscriptionProps> = ({
  transcript,
  isFinal,
  isListening,
  className = '',
}) => {
  if (!transcript && !isListening) {
    return null;
  }

  return (
    <div className={`voice-transcription ${className}`}>
      <div className="transcription-header">
        <span className="transcription-label">
          {isListening ? 'Listening...' : 'Heard:'}
        </span>
        {!isFinal && transcript && (
          <span className="transcription-interim-badge">interim</span>
        )}
      </div>
      <div className={`transcription-text ${isFinal ? 'final' : 'interim'}`}>
        {transcript || (isListening ? 'Speak now...' : '')}
      </div>
      {isListening && !transcript && (
        <div className="transcription-hint">
          Try saying: "five plus three" or "twenty minus eight"
        </div>
      )}
    </div>
  );
};

export default VoiceTranscription;