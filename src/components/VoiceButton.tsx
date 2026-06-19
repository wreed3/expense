import React, { useState, useEffect, useRef } from 'react';
import VoiceService, { VoiceTranscript } from '../services/voiceService';
import { checkBrowserSupport, getMicrophoneErrorMessage } from '../utils/browserSupport';

interface VoiceButtonProps {
  onTranscript?: (text: string, isFinal: boolean) => void;
  className?: string;
  disabled?: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  onTranscript, 
  className = '',
  disabled = false 
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [supportMessage, setSupportMessage] = useState<string>('');
  const voiceServiceRef = useRef<VoiceService | null>(null);

  useEffect(() => {
    // Check browser support on mount
    const support = checkBrowserSupport();
    setIsSupported(support.isSupported);
    setSupportMessage(support.message);

    if (!support.isSupported) {
      return;
    }

    // Initialize voice service
    const voiceService = new VoiceService({
      continuous: false,
      interimResults: true,
      language: 'en-US',
    });

    voiceServiceRef.current = voiceService;

    // Set up callbacks
    voiceService.onTranscript((transcript: VoiceTranscript) => {
      if (onTranscript) {
        onTranscript(transcript.text, transcript.isFinal);
      }

      if (transcript.isFinal) {
        setVoiceState('processing');
        // Auto-return to idle after a brief moment
        setTimeout(() => {
          if (voiceServiceRef.current && !voiceServiceRef.current.getIsListening()) {
            setVoiceState('idle');
          }
        }, 500);
      }
    });

    voiceService.onError((error: string, details?: any) => {
      console.error('Voice error:', error, details);
      const message = getMicrophoneErrorMessage(error);
      setErrorMessage(message);
      setVoiceState('error');

      // Clear error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
        setVoiceState('idle');
      }, 5000);
    });

    voiceService.onStateChange((isListening: boolean) => {
      if (isListening) {
        setVoiceState('listening');
      } else if (voiceState !== 'processing' && voiceState !== 'error') {
        setVoiceState('idle');
      }
    });

    // Cleanup on unmount
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
      }
    };
  }, []);

  const handleClick = () => {
    if (!isSupported || disabled || !voiceServiceRef.current) {
      return;
    }

    if (voiceState === 'listening') {
      voiceServiceRef.current.stop();
    } else if (voiceState === 'idle' || voiceState === 'processing') {
      setErrorMessage('');
      voiceServiceRef.current.start();
    }
  };

  const getButtonIcon = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <svg className="voice-icon listening" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            <circle cx="12" cy="12" r="10" className="pulse-ring" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="voice-icon processing" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="voice-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="voice-icon idle" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getButtonLabel = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening... (click to stop)';
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
        <button 
          className="voice-button disabled"
          disabled
          title={supportMessage}
        >
          <svg className="voice-icon disabled" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
          </svg>
        </button>
        <div className="voice-support-message">{supportMessage}</div>
      </div>
    );
  }

  return (
    <div className={`voice-button-container ${className}`}>
      <button
        className={`voice-button ${voiceState} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        title={getButtonLabel()}
        aria-label={getButtonLabel()}
        aria-pressed={voiceState === 'listening'}
      >
        {getButtonIcon()}
      </button>
      {voiceState === 'listening' && (
        <div className="voice-status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">Listening...</span>
        </div>
      )}
      {errorMessage && (
        <div className="voice-error-message" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default VoiceButton;