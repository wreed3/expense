import { describe, test, expect } from '@jest/globals';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

describe('Formatter Utilities', () => {
  describe('formatCurrency', () => {
    test('should format positive amounts', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    test('should format negative amounts', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    test('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    test('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    test('should round to two decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00');
      expect(formatCurrency(10.001)).toBe('$10.00');
    });
  });

  describe('formatDate', () => {
    test('should format ISO date strings', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
    });

    test('should format Date objects', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    test('should handle different date formats', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toMatch(/Jan 15, 2024/);
    });

    test('should use custom format when provided', () => {
      expect(formatDate('2024-01-15', 'yyyy-MM-dd')).toBe('2024-01-15');
      expect(formatDate('2024-01-15', 'MMM dd')).toBe('Jan 15');
    });
  });

  describe('formatPercentage', () => {
    test('should format percentages', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(1)).toBe('100%');
    });

    test('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    test('should handle over 100%', () => {
      expect(formatPercentage(1.5)).toBe('150%');
    });

    test('should round to specified decimal places', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
      expect(formatPercentage(0.12345, 1)).toBe('12.3%');
    });

    test('should handle small percentages', () => {
      expect(formatPercentage(0.001)).toBe('0%');
      expect(formatPercentage(0.001, 2)).toBe('0.10%');
    });
  });
});