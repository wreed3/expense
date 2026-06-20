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
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    const support = checkBrowserSupport();
    setIsSupported(support.isSupported);

    if (!support.isSupported) {
      setError(support.recommendations.join(' '));
    }

    voiceService.setCallbacks({
      onStateChange: (newState) => {
        setState(newState);
        if (newState === 'idle') {
          setCurrentTranscript('');
        }
      },
      onTranscript: (result: TranscriptionResult) => {
        setCurrentTranscript(result.transcript);
        onTranscript?.(result.transcript, result.isFinal);
        
        if (error && result.transcript) {
          setError(null);
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setCurrentTranscript('');
      },
      onEnd: () => {
        setShowPermissionPrompt(false);
      },
    });

    return () => {
      voiceService.destroy();
    };
  }, [voiceService, onTranscript, error]);

  const handleClick = async () => {
    if (!isSupported) {
      return;
    }

    if (state === 'listening') {
      voiceService.stop();
      return;
    }

    setShowPermissionPrompt(true);
    const hasPermission = await requestMicrophonePermission();
    setShowPermissionPrompt(false);

    if (!hasPermission) {
      setError('Microphone permission is required. Please allow access and try again.');
      return;
    }

    voiceService.start();
  };

  const getButtonIcon = () => {
    if (state === 'processing') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
        </svg>
      );
    }

    if (state === 'listening') {
      return (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" className="voice-button-icon">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <svg viewBox="0 0 32 32" className="pulse-ring-container">
            <circle cx="16" cy="16" className="pulse-ring" />
          </svg>
        </>
      );
    }

    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (showPermissionPrompt) return 'Requesting permission...';
    if (state === 'listening') return 'Listening...';
    if (state === 'processing') return 'Processing...';
    if (state === 'error') return error || 'Error';
    return 'Click to speak';
  };

  return (
    <div className={`voice-button-container ${className}`}>
      <button
        className={`voice-button ${state} ${!isSupported ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={!isSupported || showPermissionPrompt}
        title={getStatusText()}
        aria-label={getStatusText()}
      >
        {getButtonIcon()}
      </button>
      
      <span className={`voice-status ${state}`}>
        {getStatusText()}
      </span>

      {currentTranscript && state === 'listening' && (
        <div className="current-transcript">
          {currentTranscript}
        </div>
      )}

      {error && (
        <div className="voice-error">
          {error}
        </div>
      )}
    </div>
  );
};