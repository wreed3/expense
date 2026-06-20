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
  }, []);

  const handleClick = async () => {
    if (!isSupported) {
      return;
    }

    if (state === 'listening') {
      // Stop listening
      voiceService.stop();
    } else {
      // Request permission if needed
      if (showPermissionPrompt) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          setError('Microphone permission denied. Please allow access to use voice input.');
          return;
        }
        setShowPermissionPrompt(false);
      }

      // Start listening
      setError(null);
      voiceService.start();
    }
  };

  const getButtonClass = () => {
    const classes = ['voice-button', state];
    if (!isSupported) classes.push('disabled');
    if (className) classes.push(className);
    return classes.join(' ');
  };

  const getButtonTitle = () => {
    if (!isSupported) return 'Voice input not supported in this browser';
    if (state === 'listening') return 'Stop listening';
    if (state === 'error') return 'Error - Click to retry';
    return 'Click to start voice input';
  };

  const renderIcon = () => {
    if (state === 'processing') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
          <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="15">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      );
    }

    if (state === 'error') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
        {state === 'listening' && (
          <circle cx="12" cy="12" r="10" className="pulse-ring" />
        )}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    );
  };

  return (
    <div className="voice-button-container">
      <button
        className={getButtonClass()}
        onClick={handleClick}
        disabled={!isSupported}
        title={getButtonTitle()}
        aria-label={getButtonTitle()}
      >
        {renderIcon()}
      </button>
      
      {state === 'listening' && currentTranscript && (
        <div className="voice-button-status">
          <span className="status-text">{currentTranscript}</span>
        </div>
      )}
      
      {error && (
        <div className="voice-button-error">
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};