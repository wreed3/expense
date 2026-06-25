import { db } from '../db';
import { logger } from './logger';

export interface Session {
  id: number;
  userId: number;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
}

export async function createSession(
  userId: number,
  token: string,
  ipAddress?: string,
  userAgent?: string,
  expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<Session> {
  const expiresAt = new Date(Date.now() + expiresIn).toISOString();

  await db.run(
    `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at, last_activity_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [userId, token, ipAddress || null, userAgent || null, expiresAt]
  );

  const session = await db.get(
    `SELECT * FROM sessions WHERE token = ?`,
    [token]
  );

  return session;
}

export async function getSession(token: string): Promise<Session | null> {
  const session = await db.get(
    `SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')`,
    [token]
  );

  if (session) {
    // Update last activity
    await db.run(
      `UPDATE sessions SET last_activity_at = datetime('now') WHERE id = ?`,
      [session.id]
    );
  }

  return session || null;
}

export async function deleteSession(token: string): Promise<void> {
  await db.run(`DELETE FROM sessions WHERE token = ?`, [token]);
}

export async function deleteUserSessions(userId: number, exceptToken?: string): Promise<void> {
  if (exceptToken) {
    await db.run(
      `DELETE FROM sessions WHERE user_id = ? AND token != ?`,
      [userId, exceptToken]
    );
  } else {
    await db.run(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
  }
}

export async function getUserSessions(userId: number): Promise<Session[]> {
  const sessions = await db.all(
    `SELECT * FROM sessions 
     WHERE user_id = ? AND expires_at > datetime('now')
     ORDER BY last_activity_at DESC`,
    [userId]
  );

  return sessions;
}

export async function cleanExpiredSessions(): Promise<void> {
  const result = await db.run(
    `DELETE FROM sessions WHERE expires_at <= datetime('now')`
  );

  if (result.changes > 0) {
    logger.info(`Cleaned ${result.changes} expired sessions`);
  }
}

// Run cleanup every hour
setInterval(() => {
  cleanExpiredSessions().catch((err) => {
    logger.error('Session cleanup error:', err);
  });
}, 60 * 60 * 1000);