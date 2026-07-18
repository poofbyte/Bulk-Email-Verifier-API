const rateLimit = require('express-rate-limit');

// In-memory store for per-key rate limiting
const keyStore = new Map();

function createKeyRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
      return req.tierConfig?.requestsPerMinute || 10;
    },
    keyGenerator: (req) => {
      return req.apiKey?.id?.toString() || req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Your ${req.apiKey?.tier || 'free'} tier allows ${req.tierConfig?.requestsPerMinute || 10} requests per minute.`,
          retryAfter: Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000),
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
      incr: (key) => {
        const now = Date.now();
        const windowMs = 60 * 1000;
        const record = keyStore.get(key);

        if (!record || now - record.windowStart > windowMs) {
          keyStore.set(key, { count: 1, windowStart: now });
          return { count: 1, resetTime: now + windowMs };
        }

        record.count++;
        return { count: record.count, resetTime: record.windowStart + windowMs };
      },
      decrement: (key) => {
        const record = keyStore.get(key);
        if (record && record.count > 0) {
          record.count--;
        }
      },
      reset: (key) => {
        keyStore.delete(key);
      },
    },
  });
}

// Global IP-based rate limiter for unauthenticated endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    });
  },
});

module.exports = { createKeyRateLimiter, globalLimiter };
