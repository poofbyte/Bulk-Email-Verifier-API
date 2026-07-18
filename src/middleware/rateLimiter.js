const rateLimit = require('express-rate-limit');

// Per-key rate limiter
function createKeyRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: (req) => req.tierConfig?.requestsPerMinute || 10,
    keyGenerator: (req) => req.apiKey?.id?.toString() || req.ip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Your ${req.apiKey?.tier || 'free'} tier allows ${req.tierConfig?.requestsPerMinute || 10} requests per minute.`,
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Global IP-based rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
