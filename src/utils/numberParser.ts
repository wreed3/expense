/**
 * Number Parser - Converts spoken number words to digits
 * Phase 3: Enhanced Number Recognition
 * 
 * Supports:
 * - Numbers 0-999,999,999 (up to hundreds of millions)
 * - Decimals (e.g., "three point five")
 * - Negative numbers (e.g., "negative ten", "minus five")
 * - Compound numbers (e.g., "three hundred fifty two")
 */

// Basic number word mappings
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

const SCALES: Record<string, number> = {
  'hundred': 100,
  'thousand': 1000,
  'million': 1000000,
};

// Common homophones and variations
const HOMOPHONES: Record<string, string> = {
  'to': 'two',
  'too': 'two',
  'for': 'four',
  'fore': 'four',
  'ate': 'eight',
  'won': 'one',
  'a': 'one',
  'an': 'one',
};

// Decimal point indicators
const DECIMAL_INDICATORS = ['point', 'dot', 'decimal'];

// Negative indicators
const NEGATIVE_INDICATORS = ['negative', 'minus', 'neg'];

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
    normalized in TENS ||
    normalized in SCALES
  );
}

/**
 * Check if a word is a decimal indicator
 */
function isDecimalIndicator(word: string): boolean {
  return DECIMAL_INDICATORS.includes(word.toLowerCase());
}

/**
 * Check if a word is a negative indicator
 */
function isNegativeIndicator(word: string): boolean {
  return NEGATIVE_INDICATORS.includes(word.toLowerCase());
}

/**
 * Parse a single basic number word (0-99)
 */
function parseBasicNumber(word: string): number | null {
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
 * Parse compound number words with scales (hundreds, thousands, millions)
 * Example: "three hundred fifty two" -> 352
 * Example: "five thousand four hundred" -> 5400
 * Example: "two million three hundred thousand" -> 2300000
 */
export function parseComplexNumber(words: string[]): number | null {
  if (words.length === 0) {
    return null;
  }

  // Handle single word numbers
  if (words.length === 1) {
    return parseBasicNumber(words[0]);
  }

  let total = 0;
  let current = 0;
  let i = 0;

  while (i < words.length) {
    const word = normalizeWord(words[i]);

    // Check for scale words (hundred, thousand, million)
    if (word in SCALES) {
      const scale = SCALES[word];
      
      if (current === 0) {
        current = 1; // "hundred" means "one hundred"
      }
      
      current *= scale;
      
      // For million and thousand, add to total and reset current
      if (scale >= 1000) {
        total += current;
        current = 0;
      }
      
      i++;
      continue;
    }

    // Check for basic numbers
    const basicNum = parseBasicNumber(word);
    if (basicNum !== null) {
      current += basicNum;
      i++;
      continue;
    }

    // Skip "and" connector
    if (word === 'and') {
      i++;
      continue;
    }

    // Unknown word, try to continue
    i++;
  }

  return total + current;
}

/**
 * Parse decimal numbers
 * Example: "three point five" -> 3.5
 * Example: "twenty five point nine nine" -> 25.99
 * Example: "point five" -> 0.5
 */
function parseDecimalNumber(words: string[]): number | null {
  // Find decimal indicator
  const decimalIndex = words.findIndex(w => isDecimalIndicator(w));
  
  if (decimalIndex === -1) {
    // No decimal point, parse as regular number
    return parseComplexNumber(words);
  }

  // Split into integer and decimal parts
  const integerWords = words.slice(0, decimalIndex);
  const decimalWords = words.slice(decimalIndex + 1);

  // Parse integer part (or default to 0 if empty)
  const integerPart = integerWords.length > 0 
    ? parseComplexNumber(integerWords) 
    : 0;

  if (integerPart === null) {
    return null;
  }

  // Parse decimal part
  if (decimalWords.length === 0) {
    return integerPart;
  }

  // For decimals, parse each digit individually
  let decimalString = '';
  for (const word of decimalWords) {
    const digit = parseBasicNumber(word);
    if (digit !== null && digit >= 0 && digit <= 9) {
      decimalString += digit.toString();
    }
  }

  if (decimalString.length === 0) {
    return integerPart;
  }

  // Combine integer and decimal parts
  const decimalValue = parseFloat(`${integerPart}.${decimalString}`);
  return isNaN(decimalValue) ? null : decimalValue;
}

/**
 * Extract all numbers from a transcript
 */
export interface ExtractedNumber {
  value: number;
  startIndex: number;
  endIndex: number;
  words: string[];
}

export function extractNumbers(transcript: string): ExtractedNumber[] {
  const words = transcript.toLowerCase().split(/\s+/);
  const numbers: ExtractedNumber[] = [];
  let i = 0;

  while (i < words.length) {
    // Check for negative indicator
    let isNegative = false;
    if (isNegativeIndicator(words[i])) {
      isNegative = true;
      i++;
    }

    // Try to parse a number starting at this position
    let j = i;
    let foundNumber = false;

    // Try increasingly longer sequences
    while (j < words.length) {
      const sequence = words.slice(i, j + 1);
      const value = parseDecimalNumber(sequence);

      if (value !== null) {
        foundNumber = true;
        j++;
      } else if (foundNumber) {
        // We had a valid number, but adding more words broke it
        break;
      } else {
        // Not a number yet, but might become one with more words
        const word = normalizeWord(words[j]);
        if (isNumberWord(word) || isDecimalIndicator(word) || word === 'and') {
          j++;
        } else {
          break;
        }
      }
    }

    if (foundNumber) {
      const sequence = words.slice(i, j);
      const value = parseDecimalNumber(sequence);
      
      if (value !== null) {
        numbers.push({
          value: isNegative ? -value : value,
          startIndex: isNegative ? i - 1 : i,
          endIndex: j - 1,
          words: isNegative ? [words[i - 1], ...sequence] : sequence,
        });
      }
      
      i = j;
    } else {
      i++;
    }
  }

  return numbers;
}

/**
 * Parse a number from a string (handles various formats)
 */
export function parseNumber(text: string): number | null {
  const words = text.toLowerCase().trim().split(/\s+/);
  
  // Check for negative
  let isNegative = false;
  let startIndex = 0;
  
  if (words.length > 0 && isNegativeIndicator(words[0])) {
    isNegative = true;
    startIndex = 1;
  }

  const numberWords = words.slice(startIndex);
  const value = parseDecimalNumber(numberWords);

  if (value === null) {
    return null;
  }

  return isNegative ? -value : value;
}

/**
 * Get supported number words for documentation
 */
export function getSupportedNumberWords(): string[] {
  return [
    ...Object.keys(ONES),
    ...Object.keys(TEENS),
    ...Object.keys(TENS),
    ...Object.keys(SCALES),
    ...DECIMAL_INDICATORS,
    ...NEGATIVE_INDICATORS,
  ];
}

/**
 * Format a number as words (reverse operation)
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'zero';

  let isNegative = num < 0;
  num = Math.abs(num);

  // Handle decimals
  if (!Number.isInteger(num)) {
    const [intPart, decPart] = num.toString().split('.');
    const intWords = numberToWords(parseInt(intPart));
    const decWords = decPart.split('').map(d => numberToWords(parseInt(d))).join(' ');
    const result = `${intWords} point ${decWords}`;
    return isNegative ? `negative ${result}` : result;
  }

  const words: string[] = [];

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    words.push(numberToWords(millions), 'million');
    num %= 1000000;
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    words.push(numberToWords(thousands), 'thousand');
    num %= 1000;
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    words.push(numberToWords(hundreds), 'hundred');
    num %= 100;
  }

  // Tens and ones
  if (num >= 20) {
    const tensDigit = Math.floor(num / 10);
    const tensWords = Object.entries(TENS).find(([_, v]) => v === tensDigit * 10)?.[0];
    if (tensWords) {
      words.push(tensWords);
    }
    num %= 10;
  }

  if (num >= 10 && num < 20) {
    const teensWords = Object.entries(TEENS).find(([_, v]) => v === num)?.[0];
    if (teensWords) {
      words.push(teensWords);
    }
    num = 0;
  }

  if (num > 0 && num < 10) {
    const onesWords = Object.entries(ONES).find(([_, v]) => v === num)?.[0];
    if (onesWords) {
      words.push(onesWords);
    }
  }

  const result = words.join(' ');
  return isNegative ? `negative ${result}` : result;
}