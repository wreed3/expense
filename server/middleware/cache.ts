import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: (req: Request) => string;
}

const cache = new Map<string, { data: any; expires: number }>();

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const ttl = (options.ttl || 300) * 1000; // Default 5 minutes
  const keyGenerator = options.key || ((req: Request) => req.originalUrl);

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    // Store original send function
    const originalSend = res.send;

    res.send = function (data: any) {
      // Cache the response
      try {
        const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        cache.set(key, {
          data: jsonData,
          expires: Date.now() + ttl,
        });
      } catch (error) {
        // If parsing fails, don't cache
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
};

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    const cached = cache.get(key);
    if (cached && cached.expires < now) {
      cache.delete(key);
    }
  });
}, 60000); // Run every minute