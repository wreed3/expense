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
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred with speech recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
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

  private setState(newState: VoiceServiceState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  public setCallbacks(callbacks: VoiceServiceCallbacks): void {
    this.callbacks = callbacks;
  }

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
      this.setState('error');
      this.callbacks.onError?.('Failed to start speech recognition');
    }
  }

  public stop(): void {
    if (!this.recognition || this.state !== 'listening') {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }

  public destroy(): void {
    this.stop();
    this.recognition = null;
    this.callbacks = {};
  }

  public getState(): VoiceServiceState {
    return this.state;
  }
}