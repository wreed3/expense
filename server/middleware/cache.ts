import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis client setup
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
    logger.info('Redis cache connected');
  } catch (error) {
    logger.error('Redis connection failed:', error);
  }
}

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'cache' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userId = (req as any).user?.id;
    const cacheKey = `${keyPrefix}:${userId}:${req.originalUrl}`;

    try {
      // Try to get from cache
      let cachedData: string | null = null;

      if (redisClient) {
        cachedData = await redisClient.get(cacheKey);
      } else {
        const cached = memoryCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          cachedData = JSON.stringify(cached.data);
        } else if (cached) {
          memoryCache.delete(cacheKey);
        }
      }

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original send function
      const originalSend = res.json.bind(res);

      // Override send to cache the response
      res.json = function (data: any) {
        // Cache the response
        if (res.statusCode === 200) {
          const dataToCache = JSON.stringify(data);

          if (redisClient) {
            redisClient.setex(cacheKey, ttl, dataToCache).catch((err) => {
              logger.error('Redis cache set error:', err);
            });
          } else {
            memoryCache.set(cacheKey, {
              data,
              expires: Date.now() + ttl * 1000,
            });
          }

          logger.debug(`Cache set: ${cacheKey}`);
        }

        return originalSend(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

export async function invalidateCache(pattern: string) {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated cache: ${pattern}`);
      }
    } else {
      // Clear memory cache matching pattern
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
}

// Clean up memory cache periodically
if (!redisClient) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (value.expires < now) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}