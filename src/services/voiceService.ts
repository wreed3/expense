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
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

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
      let errorMessage = 'An error occurred';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your audio settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      this.setState('error');
      this.callbacks.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      if (this.state !== 'error') {
        this.setState('idle');
      }
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Start listening for speech input
   */
  public start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition is not available');
      return;
    }

    if (this.state === 'listening') {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.callbacks.onError?.('Failed to start speech recognition');
    }
  }

  /**
   * Stop listening for speech input
   */
  public stop(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  /**
   * Abort current recognition session
   */
  public abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.setState('idle');
    } catch (error) {
      console.error('Failed to abort speech recognition:', error);
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
   * Update service state
   */
  private setState(newState: VoiceServiceState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.recognition = null;
    this.callbacks = {};
  }
}