/**
 * Voice Service for Speech Recognition
 * Handles voice input capture and transcription using Web Speech API
 */

export interface VoiceServiceConfig {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
}

export interface VoiceTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export type VoiceServiceCallback = (transcript: VoiceTranscript) => void;
export type VoiceErrorCallback = (error: string, details?: any) => void;
export type VoiceStateCallback = (isListening: boolean) => void;

class VoiceService {
  private recognition: any = null;
  private isListening = false;
  private onTranscriptCallback: VoiceServiceCallback | null = null;
  private onErrorCallback: VoiceErrorCallback | null = null;
  private onStateChangeCallback: VoiceStateCallback | null = null;
  private config: VoiceServiceConfig;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      continuous: false,
      interimResults: true,
      language: 'en-US',
      maxAlternatives: 1,
      ...config,
    };

    this.initializeRecognition();
  }

  /**
   * Initializes the Speech Recognition instance
   */
  private initializeRecognition(): void {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition API is not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.setupEventHandlers();
  }

  /**
   * Sets up event handlers for the recognition instance
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    // Handle recognition results
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      const confidence = result[0].confidence;

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback({
          text: transcript,
          isFinal,
          confidence,
          timestamp: Date.now(),
        });
      }

      // Auto-stop if not continuous and result is final
      if (isFinal && !this.config.continuous) {
        this.stop();
      }
    };

    // Handle recognition errors
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error, event);
      }

      // Stop listening on error
      this.isListening = false;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
    };

    // Handle recognition end
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    };

    // Handle no speech detected
    this.recognition.onspeechend = () => {
      if (!this.config.continuous) {
        this.stop();
      }
    };

    // Handle audio start
    this.recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    // Handle audio end
    this.recognition.onaudioend = () => {
      console.log('Audio capture ended');
    };
  }

  /**
   * Starts voice recognition
   */
  public start(): void {
    if (!this.recognition) {
      if (this.onErrorCallback) {
        this.onErrorCallback('not-supported', { message: 'Speech Recognition is not supported' });
      }
      return;
    }

    if (this.isListening) {
      console.warn('Voice recognition is already active');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('start-failed', error);
      }
    }
  }

  /**
   * Stops voice recognition
   */
  public stop(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  /**
   * Aborts voice recognition immediately
   */
  public abort(): void {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.abort();
      this.isListening = false;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    } catch (error) {
      console.error('Error aborting voice recognition:', error);
    }
  }

  /**
   * Registers a callback for transcription results
   */
  public onTranscript(callback: VoiceServiceCallback): void {
    this.onTranscriptCallback = callback;
  }

  /**
   * Registers a callback for errors
   */
  public onError(callback: VoiceErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Registers a callback for state changes
   */
  public onStateChange(callback: VoiceStateCallback): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Returns whether voice recognition is currently active
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Updates the configuration
   */
  public updateConfig(config: Partial<VoiceServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Cleans up the service
   */
  public destroy(): void {
    this.abort();
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
    this.onStateChangeCallback = null;
    this.recognition = null;
  }
}

export default VoiceService;