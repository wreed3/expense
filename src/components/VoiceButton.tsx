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
    // Check browser support on mount
    const support = checkBrowserSupport();
    setIsSupported(support.isSupported);

    if (!support.isSupported) {
      setError(support.recommendations.join(' '));
    }

    // Set up voice service callbacks
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
        
        // Clear error when we get a successful transcription
        if (error && result.transcript) {
          setError(null);
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setCurrentTranscript('');
      },
      onEnd: () => {
        // Optionally handle end event
      },
    });

    // Cleanup on unmount
    return () => {
      voiceService.destroy();
    };
  }, [voiceService, onTranscript, error]);

  const handleClick = async () => {
    if (!isSupported) {
      return;
    }

    if (state === 'listening') {
      // Stop listening
      voiceService.stop();
      setCurrentTranscript('');
    } else {
      // Request permission first
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        setError('Microphone permission is required. Please allow access and try again.');
        setShowPermissionPrompt(true);
        return;
      }

      setShowPermissionPrompt(false);
      setError(null);
      
      // Start listening
      voiceService.start();
    }
  };

  const getButtonIcon = () => {
    switch (state) {
      case 'listening':
        return (
          <svg className="voice-button-icon listening" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            <circle className="pulse-ring" cx="12" cy="12" r="10" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="voice-button-icon processing" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="voice-button-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="voice-button-icon idle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getButtonLabel = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Voice Input';
    }
  };

  if (!isSupported) {
    return (
      <div className={`voice-button-container unsupported ${className}`}>
        <button className="voice-button disabled" disabled title="Voice input not supported">
          <svg className="voice-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
        {error && <div className="voice-error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className={`voice-button-container ${className}`}>
      <button
        className={`voice-button ${state}`}
        onClick={handleClick}
        disabled={state === 'processing'}
        title={getButtonLabel()}
        aria-label={getButtonLabel()}
        aria-pressed={state === 'listening'}
      >
        {getButtonIcon()}
      </button>
      
      {state === 'listening' && (
        <div className="voice-status">
          <span className="voice-status-text">{getButtonLabel()}</span>
          {currentTranscript && (
            <div className="voice-transcript-preview">
              {currentTranscript}
            </div>
          )}
        </div>
      )}

      {error && state !== 'listening' && (
        <div className="voice-error-message">
          {error}
          {showPermissionPrompt && (
            <button 
              className="permission-retry-button"
              onClick={handleClick}
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
};