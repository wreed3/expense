/**
 * Voice Button Component
 * Phase 1: Simple button with listening state visualization
 */

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
        // Optional handling
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

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError('Microphone permission denied. Please enable microphone access in your browser settings.');
      setShowPermissionPrompt(true);
      return;
    }

    setShowPermissionPrompt(false);
    voiceService.start();
  };

  const getButtonIcon = () => {
    switch (state) {
      case 'listening':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="voice-button-icon">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        );
      case 'processing':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M15 9l-6 6m0-6l6 6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" className="voice-button-icon">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        );
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Click to speak';
    }
  };

  return (
    <div className={`voice-button-container ${className}`}>
      <button
        className={`voice-button ${state} ${!isSupported ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={!isSupported}
        title={getStateLabel()}
        aria-label={getStateLabel()}
      >
        {state === 'listening' && (
          <svg className="pulse-ring-container" viewBox="0 0 24 24">
            <circle className="pulse-ring" cx="12" cy="12" r="10" />
          </svg>
        )}
        {getButtonIcon()}
      </button>

      {state === 'listening' && currentTranscript && (
        <div className="current-transcript">
          {currentTranscript}
        </div>
      )}

      {error && (
        <div className="voice-error-message">
          {error}
        </div>
      )}

      {showPermissionPrompt && (
        <div className="permission-prompt">
          <p>Please allow microphone access to use voice input</p>
        </div>
      )}

      {!isSupported && (
        <div className="browser-warning">
          <p>Voice input not supported in this browser</p>
        </div>
      )}
    </div>
  );
};