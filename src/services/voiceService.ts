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
      
      if (lastResult) {
        const alternative = lastResult[0];
        const result: TranscriptionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: lastResult.isFinal,
          timestamp: new Date(),
        };

        this.callbacks.onTranscript?.(result);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred during speech recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or microphone access denied.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
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
      this.setState('idle');
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Set the state and notify listeners
   */
  private setState(newState: VoiceServiceState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Start listening for speech
   */
  public start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition is not initialized');
      return;
    }

    if (this.state === 'listening') {
      console.warn('Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.callbacks.onError?.('Failed to start speech recognition');
    }
  }

  /**
   * Stop listening for speech
   */
  public stop(): void {
    if (!this.recognition) return;

    if (this.state === 'listening') {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition immediately
   */
  public abort(): void {
    if (!this.recognition) return;
    this.recognition.abort();
  }

  /**
   * Get the current state
   */
  public getState(): VoiceServiceState {
    return this.state;
  }

  /**
   * Set callbacks for voice service events
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
   * Clean up resources
   */
  public destroy(): void {
    this.abort();
    this.recognition = null;
    this.callbacks = {};
  }
}