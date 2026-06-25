import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[^a-zA-Z0-9]/.test(password),
    'Password must contain at least one special character'
  );

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Use both uppercase and lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include special characters');
  }

  // Common patterns check
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^abc123/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common patterns and repeated characters');
      break;
    }
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, Math.floor(score / 1.5)));

  return {
    score,
    feedback,
    isStrong: score >= 3,
  };
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  try {
    passwordSchema.parse(password);
    const strength = checkPasswordStrength(password);
    
    if (!strength.isStrong) {
      return {
        valid: false,
        errors: ['Password is not strong enough', ...strength.feedback],
      };
    }
    
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return { valid: false, errors: ['Invalid password'] };
  }
}