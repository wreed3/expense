import React, { useState, useEffect, useRef } from 'react';
import VoiceService, { VoiceTranscript } from '../services/voiceService';
import { checkBrowserSupport, getMicrophoneErrorMessage } from '../utils/browserSupport';

interface VoiceButtonProps {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onStateChange?: (isListening: boolean) => void;
  className?: string;
  disabled?: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  onTranscript,
  onStateChange,
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
      setVoiceState(isListening ? 'listening' : 'idle');
      if (onStateChange) {
        onStateChange(isListening);
      }
    });

    // Cleanup on unmount
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, [onTranscript, onStateChange]);

  const handleClick = () => {
    if (!isSupported || disabled || !voiceServiceRef.current) {
      return;
    }

    const isCurrentlyListening = voiceServiceRef.current.getIsListening();

    if (isCurrentlyListening) {
      voiceServiceRef.current.stop();
    } else {
      setErrorMessage('');
      voiceServiceRef.current.start();
    }
  };

  const getButtonIcon = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <svg className="voice-icon listening" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="pulse-ring" cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="voice-icon processing" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="voice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="voice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
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
    <div className={`voice-button-container ${!isSupported ? 'unsupported' : ''} ${className}`}>
      <button
        className={`voice-button ${voiceState}`}
        onClick={handleClick}
        disabled={!isSupported || disabled}
        aria-label={getStatusText()}
        title={getStatusText()}
      >
        {getButtonIcon()}
      </button>

      {voiceState === 'listening' && (
        <div className="voice-status-indicator">
          <span className="status-dot" />
          <span className="status-text">{getStatusText()}</span>
        </div>
      )}

      {errorMessage && (
        <div className="voice-error-message" role="alert">
          {errorMessage}
        </div>
      )}

      {!isSupported && (
        <div className="voice-support-message">
          {supportMessage}
        </div>
      )}
    </div>
  );
};

export default VoiceButton;