require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const pino = require('pino');
const swaggerUi = require('swagger-ui-express');

const path = require('path');
const config = require('./config');
const { runMigrations } = require('./db/migrations');
const { closeDb } = require('./db/database');
const swaggerSpec = require('./docs/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

// Routes
const validateRoutes = require('./routes/validate');
const usageRoutes = require('./routes/usage');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Logger
const logger = pino({
  level: config.logLevel,
  transport: config.isDev ? { target: 'pino-pretty' } : undefined,
});

async function start() {
  // Initialize database
  await runMigrations();
  logger.info('Database initialized');

  const app = express();

  // Security
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors({ origin: config.corsOrigins === '*' ? true : config.corsOrigins.split(',') }));
  app.use(hpp());

  // Body parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: Date.now() - start,
        ip: req.ip,
      });
    });
    next();
  });

  // Swagger docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bulk Email Verifier API Docs',
  }));

  // OpenAPI spec endpoint
  app.get('/openapi.json', (req, res) => {
    res.json(swaggerSpec);
  });

  // Public routes
  app.use('/api/v1/health', globalLimiter, healthRoutes);

  // Protected routes
  app.use('/api/v1/validate', validateRoutes);
  app.use('/api/v1/usage', globalLimiter, usageRoutes);

  // Admin routes
  app.use('/api/v1/admin', adminRoutes);

  // Auth routes
  app.use('/api/v1/auth', authRoutes);

  // Static file serving (built React app)
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
  }));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/docs') || req.path === '/openapi.json') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  const server = app.listen(config.port, config.host, () => {
    logger.info(`Bulk Email Verifier API running on ${config.host}:${config.port}`);
    logger.info(`API docs available at http://localhost:${config.port}/docs`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
