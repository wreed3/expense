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
      console.log('Voice recognition started');
      this.setState('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.setState('processing');

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        console.log(`Transcript: "${transcript}" (confidence: ${confidence}, final: ${isFinal})`);

        this.callbacks.onTranscript?.({
          transcript,
          confidence,
          isFinal,
          timestamp: new Date(),
        });
      }

      // Return to listening state if continuous mode
      if (this.config.continuous) {
        this.setState('listening');
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Voice recognition error:', event.error);
      
      let errorMessage = 'An error occurred with voice recognition';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone detected. Please check your audio settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Voice recognition was aborted.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }

      this.setState('error');
      this.callbacks.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      console.log('Voice recognition ended');
      
      // Only set to idle if not in error state
      if (this.state !== 'error') {
        this.setState('idle');
      }
      
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Start voice recognition
   */
  public start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition is not available');
      return;
    }

    if (this.state === 'listening') {
      console.warn('Voice recognition is already active');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.setState('error');
      this.callbacks.onError?.('Failed to start voice recognition');
    }
  }

  /**
   * Stop voice recognition
   */
  public stop(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  /**
   * Abort voice recognition immediately
   */
  public abort(): void {
    if (!this.recognition) return;

    try {
      this.recognition.abort();
      this.setState('idle');
    } catch (error) {
      console.error('Error aborting voice recognition:', error);
    }
  }

  /**
   * Set callbacks for voice recognition events
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
   * Get current state
   */
  public getState(): VoiceServiceState {
    return this.state;
  }

  /**
   * Set state and notify callbacks
   */
  private setState(newState: VoiceServiceState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
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