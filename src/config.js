const path = require('path');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',

  corsOrigins: process.env.CORS_ORIGINS || '*',

  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'data', 'verifier.db'),

  logLevel: process.env.LOG_LEVEL || 'info',

  adminKey: process.env.ADMIN_KEY || '',

  // Tier-based limits
  tiers: {
    free: {
      requestsPerMinute: 10,
      maxBatchSize: 50,
      dailyEmails: 500,
    },
    pro: {
      requestsPerMinute: 100,
      maxBatchSize: 1000,
      dailyEmails: 50000,
    },
    enterprise: {
      requestsPerMinute: 1000,
      maxBatchSize: 10000,
      dailyEmails: Infinity,
    },
  },

  // Validation config (ported from webapp)
  validation: {
    concurrency: 20,
    rateLimit: {
      global: { requests: 100, window: 60 },
      perDomain: { requests: 10, window: 60 },
    },
    config: {
      preset: 'strict',
      earlyExit: true,
    },
  },

  maxRequestBodyBytes: 100 * 1024, // 100KB
};

module.exports = config;
