'use strict';

const Redis = require('ioredis');

let redisClient = null;

function getClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      lazyConnect: true,
      retryStrategy(times) {
        // Stop retrying after 3 attempts to avoid blocking startup
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => strapi.log.info('[redis-cache] Connected to Redis'));
    redisClient.on('error', (err) => strapi.log.warn(`[redis-cache] Redis error: ${err.message}`));
  }
  return redisClient;
}

/**
 * Derive a cache key from the request URL + query string.
 */
function buildCacheKey(ctx) {
  return `strapi:cache:${ctx.request.url}`;
}

/**
 * Derive the content-type prefix from the URL so we can bust related keys.
 * e.g. /api/menus/1 → strapi:cache:/api/menus*
 */
function buildBustPattern(ctx) {
  const match = ctx.request.url.match(/^(\/api\/[^/?]+)/);
  return match ? `strapi:cache:${match[1]}*` : null;
}

module.exports = (config, { strapi }) => {
  const ttl = config.ttl ?? 3600; // seconds

  return async (ctx, next) => {
    const redis = getClient();
    const isApiRoute = ctx.request.url.startsWith('/api/');

    // --- Cache read (GET only) ---
    if (ctx.request.method === 'GET' && isApiRoute) {
      try {
        const cached = await redis.get(buildCacheKey(ctx));
        if (cached) {
          ctx.set('X-Cache', 'HIT');
          ctx.body = JSON.parse(cached);
          return;
        }
      } catch (err) {
        strapi.log.warn(`[redis-cache] Read error: ${err.message}`);
      }

      await next();

      // Store successful responses
      if (ctx.status === 200 && ctx.body) {
        try {
          await redis.set(buildCacheKey(ctx), JSON.stringify(ctx.body), 'EX', ttl);
          ctx.set('X-Cache', 'MISS');
        } catch (err) {
          strapi.log.warn(`[redis-cache] Write error: ${err.message}`);
        }
      }
      return;
    }

    // --- Cache bust (write operations) ---
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.request.method) && isApiRoute) {
      await next();
      const pattern = buildBustPattern(ctx);
      if (pattern) {
        try {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
            strapi.log.debug(`[redis-cache] Busted ${keys.length} key(s) for ${pattern}`);
          }
        } catch (err) {
          strapi.log.warn(`[redis-cache] Bust error: ${err.message}`);
        }
      }
      return;
    }

    await next();
  };
};
