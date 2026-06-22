/**
 * Math Parser - Converts spoken math expressions to calculator operations
 * Phase 2: Basic Number Recognition
 * 
 * Supports:
 * - Basic operators: +, -, ×, ÷
 * - Simple expressions like "five plus three"
 */

import { extractNumbers, ExtractedNumber } from './numberParser';

// Operator mappings
const OPERATORS: Record<string, string> = {
  'plus': '+',
  'add': '+',
  'and': '+',
  'minus': '-',
  'subtract': '-',
  'take away': '-',
  'times': '×',
  'multiply': '×',
  'multiplied by': '×',
  'divided by': '÷',
  'divide': '÷',
  'over': '÷',
};

// Operator variations for better matching
const OPERATOR_PATTERNS: Array<{ pattern: RegExp; operator: string }> = [
  { pattern: /\bplus\b/i, operator: '+' },
  { pattern: /\badd\b/i, operator: '+' },
  { pattern: /\bminus\b/i, operator: '-' },
  { pattern: /\bsubtract\b/i, operator: '-' },
  { pattern: /\btake\s+away\b/i, operator: '-' },
  { pattern: /\btimes\b/i, operator: '×' },
  { pattern: /\bmultiply\b/i, operator: '×' },
  { pattern: /\bmultiplied\s+by\b/i, operator: '×' },
  { pattern: /\bdivided\s+by\b/i, operator: '÷' },
  { pattern: /\bdivide\b/i, operator: '÷' },
  { pattern: /\bover\b/i, operator: '÷' },
];

export interface ParsedExpression {
  expression: string;
  numbers: number[];
  operators: string[];
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Extract operator from transcript
 */
function extractOperator(transcript: string): string | null {
  const normalized = transcript.toLowerCase();

  for (const { pattern, operator } of OPERATOR_PATTERNS) {
    if (pattern.test(normalized)) {
      return operator;
    }
  }

  return null;
}

/**
 * Parse a simple math expression from spoken words
 * Example: "five plus three" -> { expression: "5 + 3", numbers: [5, 3], operators: ['+'] }
 */
export function parseMathExpression(transcript: string): ParsedExpression {
  const normalized = transcript.toLowerCase().trim();

  // Extract numbers from transcript
  const extractedNumbers = extractNumbers(normalized);
  
  if (extractedNumbers.length === 0) {
    return {
      expression: '',
      numbers: [],
      operators: [],
      isValid: false,
      errorMessage: 'No numbers detected in expression',
    };
  }

  // Extract operator
  const operator = extractOperator(normalized);

  if (!operator) {
    // If only one number and no operator, it's just a number
    if (extractedNumbers.length === 1) {
      return {
        expression: extractedNumbers[0].value.toString(),
        numbers: [extractedNumbers[0].value],
        operators: [],
        isValid: true,
      };
    }

    return {
      expression: '',
      numbers: extractedNumbers.map(n => n.value),
      operators: [],
      isValid: false,
      errorMessage: 'No operator detected in expression',
    };
  }

  // For Phase 2, we only support simple two-number expressions
  if (extractedNumbers.length === 1) {
    return {
      expression: '',
      numbers: [extractedNumbers[0].value],
      operators: [operator],
      isValid: false,
      errorMessage: 'Expression requires two numbers',
    };
  }

  if (extractedNumbers.length > 2) {
    // Take first two numbers for now
    const firstTwo = extractedNumbers.slice(0, 2);
    return {
      expression: `${firstTwo[0].value} ${operator} ${firstTwo[1].value}`,
      numbers: firstTwo.map(n => n.value),
      operators: [operator],
      isValid: true,
    };
  }

  // Build expression string
  const expression = `${extractedNumbers[0].value} ${operator} ${extractedNumbers[1].value}`;

  return {
    expression,
    numbers: extractedNumbers.map(n => n.value),
    operators: [operator],
    isValid: true,
  };
}

/**
 * Calculate the result of a parsed expression
 */
export function calculateExpression(parsed: ParsedExpression): number | null {
  if (!parsed.isValid || parsed.numbers.length < 2 || parsed.operators.length < 1) {
    return null;
  }

  const [num1, num2] = parsed.numbers;
  const operator = parsed.operators[0];

  switch (operator) {
    case '+':
      return num1 + num2;
    case '-':
      return num1 - num2;
    case '×':
      return num1 * num2;
    case '÷':
      if (num2 === 0) {
        return null; // Division by zero
      }
      return num1 / num2;
    default:
      return null;
  }
}

/**
 * Parse and calculate in one step
 */
export function parseAndCalculate(transcript: string): {
  expression: string;
  result: number | null;
  error?: string;
} {
  const parsed = parseMathExpression(transcript);

  if (!parsed.isValid) {
    return {
      expression: parsed.expression,
      result: null,
      error: parsed.errorMessage,
    };
  }

  const result = calculateExpression(parsed);

  if (result === null) {
    return {
      expression: parsed.expression,
      result: null,
      error: 'Cannot calculate result (possibly division by zero)',
    };
  }

  return {
    expression: parsed.expression,
    result,
  };
}

/**
 * Get all supported operators for help/documentation
 */
export function getSupportedOperators(): Array<{ word: string; symbol: string }> {
  return [
    { word: 'plus', symbol: '+' },
    { word: 'minus', symbol: '-' },
    { word: 'times', symbol: '×' },
    { word: 'divided by', symbol: '÷' },
  ];
}

/**
 * Check if transcript contains a math expression
 */
export function isMathExpression(transcript: string): boolean {
  const normalized = transcript.toLowerCase();
  const hasOperator = OPERATOR_PATTERNS.some(({ pattern }) => pattern.test(normalized));
  const numbers = extractNumbers(normalized);
  return hasOperator && numbers.length >= 1;
}