/**
 * Browser Support Detection for Web Speech API
 * Checks if the browser supports the Web Speech API for voice recognition
 */

export interface BrowserSupportResult {
  isSupported: boolean;
  hasRecognition: boolean;
  hasSynthesis: boolean;
  browser: string;
  message: string;
}

/**
 * Detects browser and checks for Web Speech API support
 */
export function checkBrowserSupport(): BrowserSupportResult {
  const result: BrowserSupportResult = {
    isSupported: false,
    hasRecognition: false,
    hasSynthesis: false,
    browser: detectBrowser(),
    message: '',
  };

  // Check for Speech Recognition API
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;
  
  result.hasRecognition = !!SpeechRecognition;

  // Check for Speech Synthesis API
  result.hasSynthesis = 'speechSynthesis' in window;

  // Overall support (we primarily need recognition)
  result.isSupported = result.hasRecognition;

  // Generate appropriate message
  if (result.isSupported) {
    result.message = 'Voice input is supported in your browser!';
  } else {
    result.message = getBrowserSpecificMessage(result.browser);
  }

  return result;
}

/**
 * Detects the current browser
 */
function detectBrowser(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('edg')) return 'edge';
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('opera') || userAgent.includes('opr')) return 'opera';
  
  return 'unknown';
}

/**
 * Returns browser-specific help message for unsupported browsers
 */
function getBrowserSpecificMessage(browser: string): string {
  const messages: Record<string, string> = {
    firefox: 'Voice input is not supported in Firefox. Please use Chrome, Edge, or Safari.',
    unknown: 'Voice input may not be supported in your browser. Please try Chrome, Edge, or Safari.',
  };

  return messages[browser] || 'Voice input is not available in your browser. Please use a supported browser like Chrome, Edge, or Safari.';
}

/**
 * Checks if the browser is in a secure context (required for microphone access)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}

/**
 * Gets a user-friendly error message for microphone permission issues
 */
export function getMicrophoneErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'not-allowed': 'Microphone access was denied. Please allow microphone access in your browser settings.',
    'not-found': 'No microphone was found. Please connect a microphone and try again.',
    'not-readable': 'Your microphone is being used by another application. Please close other apps and try again.',
    'overconstrained': 'Microphone constraints could not be satisfied. Please check your microphone settings.',
    'type-error': 'An error occurred while accessing the microphone. Please try again.',
    'abort': 'Microphone access was aborted. Please try again.',
    'security': 'Microphone access is not allowed in insecure contexts. Please use HTTPS.',
  };

  return errorMessages[error] || 'An unknown error occurred while accessing the microphone. Please try again.';
}