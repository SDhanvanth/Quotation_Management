import cache from 'memory-cache';
import logger from '../config/logger.js';

export const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = cache.get(key);

    if (cachedBody) {
      logger.info(`✅ Cache HIT: ${key}`);
      res.send(cachedBody);
      return;
    }

    logger.info(`❌ Cache MISS: ${key}`);

    // Store the original send
    const originalSend = res.send;

    // Override send
    res.send = function(body) {
      // Don't cache error responses
      if (res.statusCode < 400) {
        cache.put(key, body, duration * 1000);
        logger.info(`💾 Cached: ${key} for ${duration}s`);
      }
      originalSend.call(this, body);
    };

    next();
  };
};

// Clear cache by pattern
export const clearCache = (pattern) => {
  const keys = cache.keys();
  let clearedCount = 0;

  if (pattern) {
    // Clear specific pattern
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
        logger.info(`🗑️  Cleared cache: ${key}`);
        clearedCount++;
      }
    });
    logger.info(`✅ Cleared ${clearedCount} cache entries matching: ${pattern}`);
  } else {
    // Clear all cache
    cache.clear();
    clearedCount = keys.length;
    logger.info(`🗑️  Cleared all cache (${clearedCount} entries)`);
  }

  return clearedCount;
};

// Clear all cache
export const clearAllCache = () => {
  cache.clear();
  logger.info('🗑️  All cache cleared');
};

export default { cacheMiddleware, clearCache, clearAllCache };