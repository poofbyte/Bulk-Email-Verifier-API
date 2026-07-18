const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getUsageStats } = require('../services/keyManager');
const config = require('../config');

const router = express.Router();

/**
 * @swagger
 * /api/v1/usage:
 *   get:
 *     tags: [Usage]
 *     summary: Get current API key usage statistics
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 *       401:
 *         description: Missing API key
 */
router.get('/', authMiddleware, (req, res) => {
  const stats = getUsageStats(req.apiKey.id);
  const tierConfig = config.tiers[req.apiKey.tier];

  res.json({
    success: true,
    data: {
      key: {
        name: req.apiKey.name,
        tier: req.apiKey.tier,
        prefix: req.apiKey.key_prefix,
      },
      limits: {
        requestsPerMinute: tierConfig.requestsPerMinute,
        maxBatchSize: tierConfig.maxBatchSize,
        dailyEmails: tierConfig.dailyEmails === Infinity ? 'unlimited' : tierConfig.dailyEmails,
      },
      usage: stats,
    },
  });
});

module.exports = router;
