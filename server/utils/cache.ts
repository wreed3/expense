import Redis from 'ioredis';
import { logger } from './logger';

export class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private defaultTTL: number = 3600; // 1 hour

  constructor() {
    this.initialize();
  }

  private initialize() {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.info('Redis not configured, caching disabled');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3
      });

      this.redis.on('connect', () => {
        this.enabled = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.enabled = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const deleted = await this.redis.del(...keys);
      return deleted;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.enabled || !this.redis) return 0;

    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;

    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.enabled = false;
    }
  }
}

// Singleton instance
export const cache = new CacheService();

// Cache key generators
export const CacheKeys = {
  user: (userId: number) => `user:${userId}`,
  expenses: (userId: number, filters: string) => `expenses:${userId}:${filters}`,
  categories: (userId: number) => `categories:${userId}`,
  budgets: (userId: number, month: string) => `budgets:${userId}:${month}`,
  analytics: (userId: number, type: string, params: string) => `analytics:${userId}:${type}:${params}`,
  exchangeRate: (from: string, to: string, date: string) => `rate:${from}:${to}:${date}`,
  tags: (userId: number) => `tags:${userId}`,
  customFields: (userId: number) => `custom_fields:${userId}`,
  savedSearches: (userId: number) => `saved_searches:${userId}`
};