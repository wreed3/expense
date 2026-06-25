import { Request, Response, NextFunction } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '../db';
import { logger } from '../utils/logger';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export async function generateTwoFactorSecret(userId: number, email: string): Promise<TwoFactorSetup> {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, 'Expense Tracker', secret);
  const qrCode = await QRCode.toDataURL(otpauth);
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  
  // Store secret (not yet enabled)
  await db.run(
    `UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?`,
    [secret, userId]
  );
  
  // Store backup codes
  for (const code of backupCodes) {
    await db.run(
      `INSERT INTO two_factor_backup_codes (user_id, code, used) VALUES (?, ?, 0)`,
      [userId, code]
    );
  }
  
  return { secret, qrCode, backupCodes };
}

export async function enableTwoFactor(userId: number, token: string): Promise<boolean> {
  const user = await db.get(
    `SELECT two_factor_secret FROM users WHERE id = ?`,
    [userId]
  );
  
  if (!user || !user.two_factor_secret) {
    return false;
  }
  
  const isValid = authenticator.verify({
    token,
    secret: user.two_factor_secret,
  });
  
  if (isValid) {
    await db.run(
      `UPDATE users SET two_factor_enabled = 1 WHERE id = ?`,
      [userId]
    );
    return true;
  }
  
  return false;
}

export async function verifyTwoFactorToken(userId: number, token: string): Promise<boolean> {
  const user = await db.get(
    `SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?`,
    [userId]
  );
  
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    return true; // 2FA not enabled, skip verification
  }
  
  // Try regular token first
  const isValid = authenticator.verify({
    token,
    secret: user.two_factor_secret,
  });
  
  if (isValid) {
    return true;
  }
  
  // Try backup codes
  const backupCode = await db.get(
    `SELECT id FROM two_factor_backup_codes 
     WHERE user_id = ? AND code = ? AND used = 0`,
    [userId, token]
  );
  
  if (backupCode) {
    await db.run(
      `UPDATE two_factor_backup_codes SET used = 1 WHERE id = ?`,
      [backupCode.id]
    );
    return true;
  }
  
  return false;
}

export async function disableTwoFactor(userId: number): Promise<void> {
  await db.run(
    `UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?`,
    [userId]
  );
  
  await db.run(
    `DELETE FROM two_factor_backup_codes WHERE user_id = ?`,
    [userId]
  );
}

export function requireTwoFactor(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const twoFactorVerified = (req as any).twoFactorVerified;
  
  if (user && user.two_factor_enabled && !twoFactorVerified) {
    return res.status(403).json({
      error: 'Two-factor authentication required',
      requiresTwoFactor: true,
    });
  }
  
  next();
}