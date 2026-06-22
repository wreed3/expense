/**
 * Math Parser - Converts spoken math expressions to calculator operations
 * Phase 3: Enhanced to support larger numbers, decimals, and negatives
 * 
 * Supports:
 * - Basic operators: +, -, ×, ÷
 * - Large numbers (hundreds, thousands, millions)
 * - Decimal numbers (e.g., "three point five")
 * - Negative numbers (e.g., "negative ten")
 * - Simple expressions like "five hundred plus three point five"
 */

import { extractNumbers, parseNumber, ExtractedNumber } from './numberParser';

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

// Operator patterns for better matching
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

export interface CalculationResult {
  expression: string;
  result: number | null;
  error?: string;
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
 * Example: "five hundred plus three point five" -> { expression: "500 + 3.5", numbers: [500, 3.5], operators: ['+'] }
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
      errorMessage: 'No numbers found in expression',
    };
  }

  // Extract operator
  const operator = extractOperator(normalized);

  if (!operator) {
    // If only one number and no operator, it's valid (just a number)
    if (extractedNumbers.length === 1) {
      const num = extractedNumbers[0].value;
      return {
        expression: formatNumber(num),
        numbers: [num],
        operators: [],
        isValid: true,
      };
    }

    return {
      expression: '',
      numbers: extractedNumbers.map(n => n.value),
      operators: [],
      isValid: false,
      errorMessage: 'No operator found in expression',
    };
  }

  // For now, support only two numbers
  if (extractedNumbers.length !== 2) {
    return {
      expression: '',
      numbers: extractedNumbers.map(n => n.value),
      operators: [operator],
      isValid: false,
      errorMessage: `Expected 2 numbers for operation, found ${extractedNumbers.length}`,
    };
  }

  const [num1, num2] = extractedNumbers.map(n => n.value);
  const expression = `${formatNumber(num1)} ${operator} ${formatNumber(num2)}`;

  return {
    expression,
    numbers: [num1, num2],
    operators: [operator],
    isValid: true,
  };
}

/**
 * Format a number for display (handle decimals nicely)
 */
function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  // Round to 2 decimal places for display
  return num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Calculate the result of a simple expression
 */
export function calculateExpression(num1: number, operator: string, num2: number): number | null {
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
 * Parse and calculate a math expression in one step
 */
export function parseAndCalculate(transcript: string): CalculationResult {
  const parsed = parseMathExpression(transcript);

  if (!parsed.isValid) {
    return {
      expression: parsed.expression || transcript,
      result: null,
      error: parsed.errorMessage,
    };
  }

  // If it's just a number (no operator), return it
  if (parsed.operators.length === 0 && parsed.numbers.length === 1) {
    return {
      expression: parsed.expression,
      result: parsed.numbers[0],
    };
  }

  // Calculate the result
  if (parsed.numbers.length === 2 && parsed.operators.length === 1) {
    const result = calculateExpression(
      parsed.numbers[0],
      parsed.operators[0],
      parsed.numbers[1]
    );

    if (result === null) {
      return {
        expression: parsed.expression,
        result: null,
        error: 'Division by zero',
      };
    }

    return {
      expression: parsed.expression,
      result,
    };
  }

  return {
    expression: parsed.expression,
    result: null,
    error: 'Invalid expression format',
  };
}

/**
 * Get supported operators for documentation
 */
export function getSupportedOperators(): Array<{ words: string[]; symbol: string }> {
  return [
    { words: ['plus', 'add'], symbol: '+' },
    { words: ['minus', 'subtract', 'take away'], symbol: '-' },
    { words: ['times', 'multiply', 'multiplied by'], symbol: '×' },
    { words: ['divided by', 'divide', 'over'], symbol: '÷' },
  ];
}

/**
 * Validate if a transcript looks like a math expression
 */
export function looksLikeMathExpression(transcript: string): boolean {
  const normalized = transcript.toLowerCase();
  
  // Check for operator keywords
  const hasOperator = OPERATOR_PATTERNS.some(({ pattern }) => pattern.test(normalized));
  
  // Check for number words
  const numbers = extractNumbers(normalized);
  const hasNumbers = numbers.length > 0;
  
  return hasOperator && hasNumbers;
}