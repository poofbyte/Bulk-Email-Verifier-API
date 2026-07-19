const rateLimit = require('express-rate-limit');
const config = require('../config');

// Per-key rate limiter - returns a function that creates rate limiter middleware
function createKeyRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
      // Use tier config if available, otherwise use default
      if (req.tierConfig) {
        return req.tierConfig.requestsPerMinute;
      }
      // If no tier config, default to 10
      return 10;
    },
    keyGenerator: (req) => {
      // Use API key ID if available, otherwise use IP
      return req.apiKey?.id?.toString() || req.ip;
    },
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

// Auth-specific rate limiter (stricter limits for auth endpoints)
function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute for auth endpoints
    keyGenerator: (req) => {
      // Use email for login/signup if available, otherwise use IP
      const email = req.body?.email;
      if (email) {
        return `auth_${email}`;
      }
      return `auth_${req.ip}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Global IP-based rate limiter
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

// Daily usage enforcer - checks if user has exceeded their daily email limit
function createDailyUsageEnforcer() {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.id) {
      return next();
    }
    
    const { checkDailyLimit, logUsage } = require('../services/keyManager');
    const { validateBulk } = req.body;
    const emailsCount = Array.isArray(req.body.emails) ? req.body.emails.length : 1;
    
    // Check if user has exceeded daily limit
    if (!checkDailyLimit(req.apiKey.id, emailsCount)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `You have reached your daily email validation limit. Your tier allows ${req.tierConfig?.dailyEmails || 500} emails per day.`,
        },
      });
    }
    
    next();
  };
}

module.exports = { 
  createKeyRateLimiter, 
  globalLimiter,
  createAuthRateLimiter,
  createDailyUsageEnforcer,
};