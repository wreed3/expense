import { describe, test, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validateAmount,
  validateDate,
} from '../../utils/validators';

describe('Validator Utilities', () => {
  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true);
      expect(validateEmail('test@localhost')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
      expect(validatePassword('Str0ng!Pass')).toBe(true);
    });

    test('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });

    test('should enforce minimum length', () => {
      expect(validatePassword('Pass1!')).toBe(false);
      expect(validatePassword('Password1!')).toBe(true);
    });

    test('should require mixed case', () => {
      expect(validatePassword('password123!')).toBe(false);
      expect(validatePassword('PASSWORD123!')).toBe(false);
      expect(validatePassword('Password123!')).toBe(true);
    });

    test('should require numbers', () => {
      expect(validatePassword('Password!')).toBe(false);
      expect(validatePassword('Password1!')).toBe(true);
    });

    test('should require special characters', () => {
      expect(validatePassword('Password123')).toBe(false);
      expect(validatePassword('Password123!')).toBe(true);
    });
  });

  describe('validateAmount', () => {
    test('should validate positive amounts', () => {
      expect(validateAmount(10)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(1000000)).toBe(true);
    });

    test('should reject negative amounts', () => {
      expect(validateAmount(-10)).toBe(false);
      expect(validateAmount(-0.01)).toBe(false);
    });

    test('should reject zero', () => {
      expect(validateAmount(0)).toBe(false);
    });

    test('should handle string inputs', () => {
      expect(validateAmount('50.00')).toBe(true);
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('-50')).toBe(false);
    });

    test('should reject invalid inputs', () => {
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount('invalid')).toBe(false);
    });

    test('should enforce maximum decimal places', () => {
      expect(validateAmount(10.99)).toBe(true);
      expect(validateAmount(10.999)).toBe(false);
    });
  });

  describe('validateDate', () => {
    test('should validate correct date formats', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-12-31')).toBe(true);
      expect(validateDate('2000-01-01')).toBe(true);
    });

    test('should reject invalid date formats', () => {
      expect(validateDate('2024/01/15')).toBe(false);
      expect(validateDate('15-01-2024')).toBe(false);
      expect(validateDate('2024-13-01')).toBe(false);
      expect(validateDate('2024-01-32')).toBe(false);
    });

    test('should reject future dates when specified', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      expect(validateDate(futureDateStr, { allowFuture: false })).toBe(false);
      expect(validateDate(futureDateStr, { allowFuture: true })).toBe(true);
    });

    test('should validate Date objects', () => {
      expect(validateDate(new Date('2024-01-15'))).toBe(true);
      expect(validateDate(new Date('invalid'))).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateDate('2024-02-29')).toBe(true); // Leap year
      expect(validateDate('2023-02-29')).toBe(false); // Not a leap year
    });
  });
});