import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

class CacheManager {
  private client: Redis | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.ENABLE_CACHE === 'true';
    
    if (this.isEnabled) {
      this.connect();
    }
  }

  private connect() {
    try {
      this.client = new Redis(REDIS_CONFIG);

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isEnabled = false;
      });

      this.client.on('ready', () => {
        logger.info('Redis is ready to accept commands');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string | string[]): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete error:`, error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Get or set cached value
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUser(userId: number): Promise<void> {
    await this.delPattern(`user:${userId}:*`);
  }

  /**
   * Invalidate expense-related cache
   */
  async invalidateExpenses(userId: number): Promise<void> {
    await this.delPattern(`user:${userId}:expenses:*`);
    await this.delPattern(`user:${userId}:summary:*`);
    await this.delPattern(`user:${userId}:analytics:*`);
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache key generators
export const CacheKeys = {
  userExpenses: (userId: number, filters: string) => `user:${userId}:expenses:${filters}`,
  userSummary: (userId: number, month: string) => `user:${userId}:summary:${month}`,
  userCategories: (userId: number) => `user:${userId}:categories`,
  userBudgets: (userId: number) => `user:${userId}:budgets`,
  userTags: (userId: number) => `user:${userId}:tags`,
  exchangeRate: (from: string, to: string, date: string) => `exchange:${from}:${to}:${date}`,
  searchResults: (userId: number, query: string) => `search:${userId}:${query}`,
  analytics: (userId: number, type: string, period: string) => `user:${userId}:analytics:${type}:${period}`,
};