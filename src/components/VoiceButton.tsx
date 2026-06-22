import React, { useEffect, useState } from 'react';
import { VoiceService, VoiceServiceState, TranscriptionResult } from '../services/voiceService';
import { checkBrowserSupport, requestMicrophonePermission } from '../utils/browserSupport';
import './VoiceButton.css';

interface VoiceButtonProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onTranscript, className = '' }) => {
  const [voiceService] = useState(() => new VoiceService());
  const [state, setState] = useState<VoiceServiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const support = checkBrowserSupport();
    setIsSupported(support.isSupported);

    if (!support.isSupported) {
      setError(support.recommendations.join(' '));
    }

    voiceService.setCallbacks({
      onStateChange: setState,
      onTranscript: (result: TranscriptionResult) => {
        onTranscript?.(result.transcript, result.isFinal);
        if (error) setError(null);
      },
      onError: setError,
    });

    return () => {
      voiceService.destroy();
    };
  }, [voiceService, onTranscript, error]);

  const handleClick = async () => {
    if (!isSupported) return;

    if (state === 'listening') {
      voiceService.stop();
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('Microphone permission is required');
      return;
    }

    voiceService.start();
  };

  const getButtonTitle = (): string => {
    if (!isSupported) return 'Voice input not supported';
    if (state === 'listening') return 'Click to stop listening';
    if (state === 'error') return 'Click to try again';
    return 'Click to start voice input';
  };

  const renderIcon = () => {
    if (state === 'processing') {
      return (
        <svg className="voice-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      );
    }

    if (state === 'listening') {
      return (
        <>
          <svg className="voice-button-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <svg className="pulse-ring-container" viewBox="0 0 24 24">
            <circle className="pulse-ring" cx="12" cy="12" r="10" />
          </svg>
        </>
      );
    }

    return (
      <svg className="voice-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    );
  };

  return (
    <div className={`voice-button-container ${className}`}>
      <button
        className={`voice-button ${state} ${!isSupported ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={!isSupported}
        title={getButtonTitle()}
        aria-label={getButtonTitle()}
      >
        {renderIcon()}
      </button>
      
      {state === 'listening' && (
        <span className="voice-status">Listening...</span>
      )}
      
      {error && (
        <div className="voice-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};