/**
 * Browser compatibility utilities for Web Speech API
 */

export interface BrowserSupportInfo {
  isSupported: boolean;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  browserName: string;
  recommendations: string[];
}

/**
 * Check if the Web Speech API is supported in the current browser
 */
export function checkBrowserSupport(): BrowserSupportInfo {
  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasSpeechSynthesis = 'speechSynthesis' in window;
  
  const browserName = detectBrowser();
  const recommendations: string[] = [];

  if (!hasSpeechRecognition) {
    recommendations.push('Speech recognition is not supported in this browser.');
    recommendations.push('Try using Chrome, Edge, or Safari for the best experience.');
  }

  if (!hasSpeechSynthesis) {
    recommendations.push('Speech synthesis is not supported in this browser.');
  }

  return {
    isSupported: hasSpeechRecognition,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    browserName,
    recommendations,
  };
}

/**
 * Detect the current browser
 */
function detectBrowser(): string {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Edg')) {
    return 'Edge';
  } else if (userAgent.includes('Chrome')) {
    return 'Chrome';
  } else if (userAgent.includes('Safari')) {
    return 'Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'Opera';
  }

  return 'Unknown';
}

/**
 * Get the SpeechRecognition constructor (handles vendor prefixes)
 */
export function getSpeechRecognition(): typeof SpeechRecognition | null {
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition;
  } else if ('webkitSpeechRecognition' in window) {
    return (window as any).webkitSpeechRecognition;
  }
  return null;
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately - we just wanted to request permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if microphone permission has been granted
 */
export async function checkMicrophonePermission(): Promise<PermissionState | 'unsupported'> {
  try {
    if (!navigator.permissions) {
      return 'unsupported';
    }
    
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return 'unsupported';
  }
}