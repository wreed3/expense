import { useState, useEffect, useRef, useCallback } from 'react';
import VoiceService, { VoiceTranscript, VoiceServiceConfig } from '../services/voiceService';
import { checkBrowserSupport } from '../utils/browserSupport';

interface UseVoiceInputOptions extends VoiceServiceConfig {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  isFinal: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Custom hook for voice input functionality
 * Provides a simple interface for voice recognition in React components
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize voice service
  useEffect(() => {
    const support = checkBrowserSupport();
    setIsSupported(support.isSupported);

    if (!support.isSupported) {
      setError(support.message);
      return;
    }

    const voiceService = new VoiceService({
      continuous: options.continuous || false,
      interimResults: options.interimResults !== false,
      language: options.language || 'en-US',
      maxAlternatives: options.maxAlternatives || 1,
    });

    voiceServiceRef.current = voiceService;

    // Set up transcript callback
    voiceService.onTranscript((transcriptData: VoiceTranscript) => {
      setTranscript(transcriptData.text);
      setIsFinal(transcriptData.isFinal);
      
      if (optionsRef.current.onTranscript) {
        optionsRef.current.onTranscript(transcriptData.text, transcriptData.isFinal);
      }
    });

    // Set up error callback
    voiceService.onError((errorCode: string) => {
      setError(errorCode);
      setIsListening(false);
      
      if (optionsRef.current.onError) {
        optionsRef.current.onError(errorCode);
      }
    });

    // Set up state change callback
    voiceService.onStateChange((listening: boolean) => {
      setIsListening(listening);
    });

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (voiceServiceRef.current && !isListening) {
      setError(null);
      setTranscript('');
      setIsFinal(false);
      voiceServiceRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (voiceServiceRef.current && isListening) {
      voiceServiceRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setIsFinal(false);
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    isFinal,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}