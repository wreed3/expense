import { Request, Response, NextFunction } from 'express';
import { cacheManager } from '../utils/cache.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!cacheManager.getIsEnabled()) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `${req.originalUrl}:user:${req.user?.id}`;

      const cachedData = await cacheManager.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        cacheManager.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache response:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

export function invalidateCache(pattern: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cacheManager.delPattern(pattern);
      next();
    } catch (error) {
      console.error('Cache invalidation error:', error);
      next();
    }
  };
}