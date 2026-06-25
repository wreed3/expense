import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

class CacheManager {
  private client: RedisClientType | null = null;
  private isEnabled: boolean = false;

  async initialize() {
    if (process.env.REDIS_URL) {
      try {
        this.client = createClient({
          url: process.env.REDIS_URL,
        });

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err);
          this.isEnabled = false;
        });

        await this.client.connect();
        this.isEnabled = true;
        console.log('Redis cache initialized successfully');
      } catch (error) {
        console.warn('Redis not available, caching disabled:', error);
        this.isEnabled = false;
      }
    } else {
      console.log('Redis URL not configured, caching disabled');
      this.isEnabled = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache pattern delete error:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isEnabled = false;
    }
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }
}

export const cacheManager = new CacheManager();

// Cache key generators
export const cacheKeys = {
  expenses: (userId: number) => `expenses:user:${userId}`,
  expense: (id: number) => `expense:${id}`,
  categories: (userId: number) => `categories:user:${userId}`,
  budgets: (userId: number) => `budgets:user:${userId}`,
  analytics: (userId: number, type: string) => `analytics:${type}:user:${userId}`,
  tags: (userId: number) => `tags:user:${userId}`,
  customFields: (userId: number) => `custom_fields:user:${userId}`,
  currencies: () => 'currencies:all',
};