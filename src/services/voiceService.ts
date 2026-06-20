/**
 * Voice Service - Handles speech recognition for the calculator
 * Phase 1: Basic voice capture and transcription
 */

import { getSpeechRecognition } from '../utils/browserSupport';

export type VoiceServiceState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceServiceCallbacks {
  onStateChange?: (state: VoiceServiceState) => void;
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private state: VoiceServiceState = 'idle';
  private callbacks: VoiceServiceCallbacks = {};
  private config: VoiceServiceConfig;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      language: config.language || 'en-US',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives || 1,
    };

    this.initialize();
  }

  /**
   * Initialize the speech recognition instance
   */
  private initialize(): void {
    const SpeechRecognitionConstructor = getSpeechRecognition();
    
    if (!SpeechRecognitionConstructor) {
      this.setState('error');
      this.callbacks.onError?.('Speech recognition is not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionConstructor();
    this.recognition.lang = this.config.language!;
    this.recognition.continuous = this.config.continuous!;
    this.recognition.interimResults = this.config.interimResults!;
    this.recognition.maxAlternatives = this.config.maxAlternatives!;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for speech recognition
   */
  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.setState('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      this.callbacks.onTranscript?.({
        transcript,
        confidence,
        isFinal,
        timestamp: new Date(),
      });

      if (isFinal) {
        this.setState('processing');
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred during speech recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.setState('error');
      this.callbacks.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      if (this.state === 'listening') {
        this.setState('idle');
      }
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Start listening for voice input
   */
  public start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition not initialized');
      return;
    }

    if (this.state === 'listening') {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.callbacks.onError?.('Failed to start speech recognition');
      this.setState('error');
    }
  }

  /**
   * Stop listening for voice input
   */
  public stop(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
      this.setState('idle');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }

  /**
   * Toggle listening state
   */
  public toggle(): void {
    if (this.state === 'listening') {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Get current state
   */
  public getState(): VoiceServiceState {
    return this.state;
  }

  /**
   * Set callbacks
   */
  public setCallbacks(callbacks: VoiceServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<VoiceServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      if (config.language) this.recognition.lang = config.language;
      if (config.continuous !== undefined) this.recognition.continuous = config.continuous;
      if (config.interimResults !== undefined) this.recognition.interimResults = config.interimResults;
      if (config.maxAlternatives !== undefined) this.recognition.maxAlternatives = config.maxAlternatives;
    }
  }

  /**
   * Clean up and destroy the service
   */
  public destroy(): void {
    this.stop();
    this.recognition = null;
    this.callbacks = {};
  }

  /**
   * Set internal state and notify callbacks
   */
  private setState(newState: VoiceServiceState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }
}