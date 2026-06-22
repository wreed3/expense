/**
 * Money Parser - Handles money-specific voice input
 * Phase 3: Enhanced Number Recognition
 * 
 * Supports:
 * - "forty five dollars" -> 45.00
 * - "twenty five dollars and fifty cents" -> 25.50
 * - "three hundred bucks" -> 300.00
 * - "five point ninety nine" -> 5.99
 */

import { parseNumber } from './numberParser';

// Currency words
const CURRENCY_WORDS = {
  dollars: ['dollars', 'dollar', 'bucks', 'buck', 'usd'],
  cents: ['cents', 'cent', 'pennies', 'penny'],
};

/**
 * Check if text contains currency indicators
 */
export function containsCurrency(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    CURRENCY_WORDS.dollars.some(word => normalized.includes(word)) ||
    CURRENCY_WORDS.cents.some(word => normalized.includes(word)) ||
    normalized.includes('$')
  );
}

/**
 * Parse money amount from text
 * Examples:
 * - "forty five dollars" -> 45.00
 * - "twenty five dollars and fifty cents" -> 25.50
 * - "three point ninety nine" -> 3.99
 */
export function parseMoney(text: string): number | null {
  const normalized = text.toLowerCase().trim();

  // Check for "X dollars and Y cents" format
  const dollarsAndCentsPattern = /(.+?)\s+dollars?\s+and\s+(.+?)\s+cents?/i;
  const match = normalized.match(dollarsAndCentsPattern);

  if (match) {
    const dollarsText = match[1];
    const centsText = match[2];

    const dollars = parseNumber(dollarsText);
    const cents = parseNumber(centsText);

    if (dollars !== null && cents !== null) {
      return dollars + (cents / 100);
    }
  }

  // Check for "X dollars" format
  const dollarsPattern = /(.+?)\s+(?:dollars?|bucks?|usd)/i;
  const dollarsMatch = normalized.match(dollarsPattern);

  if (dollarsMatch) {
    const amount = parseNumber(dollarsMatch[1]);
    if (amount !== null) {
      return amount;
    }
  }

  // Check for "X cents" format
  const centsPattern = /(.+?)\s+(?:cents?|pennies?|penny)/i;
  const centsMatch = normalized.match(centsPattern);

  if (centsMatch) {
    const amount = parseNumber(centsMatch[1]);
    if (amount !== null) {
      return amount / 100;
    }
  }

  // Fallback to regular number parsing
  return parseNumber(normalized);
}

/**
 * Format money for display
 */
export function formatMoney(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Parse money expression with optional operator
 * Example: "add forty five dollars" -> { amount: 45.00, action: 'add' }
 */
export interface MoneyExpression {
  amount: number;
  action?: 'add' | 'subtract' | 'multiply' | 'divide';
  currency?: string;
}

export function parseMoneyExpression(text: string): MoneyExpression | null {
  const normalized = text.toLowerCase().trim();

  // Check for action words
  let action: MoneyExpression['action'] = undefined;
  let cleanedText = normalized;

  if (normalized.startsWith('add ') || normalized.startsWith('plus ')) {
    action = 'add';
    cleanedText = normalized.replace(/^(add|plus)\s+/, '');
  } else if (normalized.startsWith('subtract ') || normalized.startsWith('minus ')) {
    action = 'subtract';
    cleanedText = normalized.replace(/^(subtract|minus)\s+/, '');
  }

  const amount = parseMoney(cleanedText);

  if (amount === null) {
    return null;
  }

  return {
    amount,
    action,
    currency: '$',
  };
}