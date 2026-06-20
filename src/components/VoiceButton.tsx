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
      return;
    }

    // Request microphone permission
    setShowPermissionPrompt(true);
    const hasPermission = await requestMicrophonePermission();
    setShowPermissionPrompt(false);

    if (!hasPermission) {
      setError('Microphone access denied. Please allow microphone access in your browser settings.');
      return;
    }

    // Start listening
    setError(null);
    voiceService.start();
  };

  const getButtonClass = () => {
    const classes = ['voice-button', state];
    if (!isSupported) classes.push('disabled');
    if (className) classes.push(className);
    return classes.join(' ');
  };

  const getButtonTitle = () => {
    if (!isSupported) return 'Voice input not supported in this browser';
    if (state === 'listening') return 'Click to stop listening';
    if (state === 'processing') return 'Processing...';
    if (state === 'error') return error || 'Error occurred';
    return 'Click to start voice input';
  };

  const renderIcon = () => {
    if (state === 'listening') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="voice-button-icon">
          <circle cx="12" cy="12" r="10" className="pulse-ring" />
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      );
    }

    if (state === 'processing') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
          <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (state === 'error') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="voice-button-icon">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    // Idle state
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="voice-button-icon">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    );
  };

  const getStateLabel = () => {
    if (showPermissionPrompt) return 'Requesting permission...';
    if (state === 'listening') return 'Listening...';
    if (state === 'processing') return 'Processing...';
    if (state === 'error') return 'Error';
    return 'Click to speak';
  };

  return (
    <div className="voice-button-container">
      <button
        className={getButtonClass()}
        onClick={handleClick}
        disabled={!isSupported || showPermissionPrompt}
        title={getButtonTitle()}
        aria-label={getButtonTitle()}
      >
        {renderIcon()}
      </button>
      
      <div className="voice-button-label">
        {getStateLabel()}
      </div>

      {currentTranscript && state === 'listening' && (
        <div className="voice-button-transcript">
          "{currentTranscript}"
        </div>
      )}

      {error && (
        <div className="voice-button-error">
          {error}
        </div>
      )}
    </div>
  );
};