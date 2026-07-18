const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
    });
  }
});

module.exports = router;
