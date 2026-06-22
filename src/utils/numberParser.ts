/**
 * Number Parser - Converts spoken number words to digits
 * Phase 2: Basic Number Recognition
 * 
 * Supports:
 * - Numbers 0-99
 * - Basic number words (zero through ninety-nine)
 */

// Number word mappings
const ONES: Record<string, number> = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
};

const TEENS: Record<string, number> = {
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
};

const TENS: Record<string, number> = {
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90,
};

// Common homophones and variations
const HOMOPHONES: Record<string, string> = {
  'to': 'two',
  'too': 'two',
  'for': 'four',
  'fore': 'four',
  'ate': 'eight',
  'won': 'one',
};

/**
 * Normalize a word by handling homophones and variations
 */
function normalizeWord(word: string): string {
  const normalized = word.toLowerCase().trim();
  return HOMOPHONES[normalized] || normalized;
}

/**
 * Check if a word is a number word
 */
export function isNumberWord(word: string): boolean {
  const normalized = normalizeWord(word);
  return (
    normalized in ONES ||
    normalized in TEENS ||
    normalized in TENS
  );
}

/**
 * Parse a single number word to its digit value
 */
export function parseNumberWord(word: string): number | null {
  const normalized = normalizeWord(word);

  if (normalized in ONES) {
    return ONES[normalized];
  }

  if (normalized in TEENS) {
    return TEENS[normalized];
  }

  if (normalized in TENS) {
    return TENS[normalized];
  }

  return null;
}

/**
 * Parse compound number words (e.g., "twenty three" -> 23)
 */
export function parseCompoundNumber(words: string[]): number | null {
  if (words.length === 0) {
    return null;
  }

  if (words.length === 1) {
    return parseNumberWord(words[0]);
  }

  // Handle two-word numbers like "twenty three"
  if (words.length === 2) {
    const first = normalizeWord(words[0]);
    const second = normalizeWord(words[1]);

    // Check if first word is a tens value
    if (first in TENS) {
      const tensValue = TENS[first];
      
      // Check if second word is a ones value
      if (second in ONES) {
        const onesValue = ONES[second];
        return tensValue + onesValue;
      }
    }
  }

  return null;
}

/**
 * Convert a transcript segment to a number
 * Handles multi-word numbers like "twenty three"
 */
export function transcriptToNumber(transcript: string): number | null {
  const words = transcript.toLowerCase().trim().split(/\s+/);
  
  // Try parsing as compound number first
  const compoundResult = parseCompoundNumber(words);
  if (compoundResult !== null) {
    return compoundResult;
  }

  // Try parsing first word as single number
  if (words.length > 0) {
    return parseNumberWord(words[0]);
  }

  return null;
}

/**
 * Extract all numbers from a transcript
 * Returns array of { value, startIndex, endIndex, originalText }
 */
export interface ExtractedNumber {
  value: number;
  startIndex: number;
  endIndex: number;
  originalText: string;
}

export function extractNumbers(transcript: string): ExtractedNumber[] {
  const words = transcript.toLowerCase().split(/\s+/);
  const results: ExtractedNumber[] = [];
  let i = 0;

  while (i < words.length) {
    // Try two-word compound number
    if (i < words.length - 1) {
      const twoWords = [words[i], words[i + 1]];
      const compoundValue = parseCompoundNumber(twoWords);
      
      if (compoundValue !== null) {
        results.push({
          value: compoundValue,
          startIndex: i,
          endIndex: i + 1,
          originalText: `${words[i]} ${words[i + 1]}`,
        });
        i += 2;
        continue;
      }
    }

    // Try single word number
    const singleValue = parseNumberWord(words[i]);
    if (singleValue !== null) {
      results.push({
        value: singleValue,
        startIndex: i,
        endIndex: i,
        originalText: words[i],
      });
      i += 1;
      continue;
    }

    i += 1;
  }

  return results;
}

/**
 * Get all supported number words for help/documentation
 */
export function getSupportedNumberWords(): string[] {
  return [
    ...Object.keys(ONES),
    ...Object.keys(TEENS),
    ...Object.keys(TENS),
  ].sort();
}

/**
 * Format a number as words (reverse operation)
 * Useful for confirmation and feedback
 */
export function numberToWords(num: number): string | null {
  if (num < 0 || num > 99 || !Number.isInteger(num)) {
    return null;
  }

  // Handle 0-9
  for (const [word, value] of Object.entries(ONES)) {
    if (value === num) {
      return word;
    }
  }

  // Handle 10-19
  for (const [word, value] of Object.entries(TEENS)) {
    if (value === num) {
      return word;
    }
  }

  // Handle 20, 30, 40, etc.
  for (const [word, value] of Object.entries(TENS)) {
    if (value === num) {
      return word;
    }
  }

  // Handle compound numbers (21-99)
  const tensDigit = Math.floor(num / 10) * 10;
  const onesDigit = num % 10;

  for (const [tensWord, tensValue] of Object.entries(TENS)) {
    if (tensValue === tensDigit) {
      for (const [onesWord, onesValue] of Object.entries(ONES)) {
        if (onesValue === onesDigit) {
          return `${tensWord} ${onesWord}`;
        }
      }
    }
  }

  return null;
}