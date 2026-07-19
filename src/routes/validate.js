const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { createKeyRateLimiter, createDailyUsageEnforcer } = require('../middleware/rateLimiter');
const { validateEmail, validateBulk } = require('../middleware/validator');
const { validateSingleEmail, validateBulkEmails, sanitizeInput } = require('../services/emailValidator');
const { logUsage, getUsageStats } = require('../services/keyManager');

const router = express.Router();
const keyLimiter = createKeyRateLimiter();
const dailyEnforcer = createDailyUsageEnforcer();

/**
 * @swagger
 * /api/v1/validate:
 *   post:
 *     tags: [Validation]
 *     summary: Validate a single email address
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Missing API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', authMiddleware, keyLimiter, dailyEnforcer, validateEmail, async (req, res, next) => {
  try {
    const startTime = Date.now();
    const email = sanitizeInput(req.validulatedBody.email);
    const result = await validateSingleEmail(email);
    const duration = Date.now() - startTime;

    logUsage(req.apiKey.id, 'validate', 1, duration);

    res.json({
      success: true,
      data: result,
      meta: { duration_ms: duration },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/validate/bulk:
 *   post:
 *     tags: [Validation]
 *     summary: Validate multiple email addresses
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emails]
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 example: ["user@example.com", "test@gmail.com"]
 *     responses:
 *       200:
 *         description: Bulk validation results
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Missing API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/bulk', authMiddleware, keyLimiter, dailyEnforcer, validateBulk, async (req, res, next) => {
  try {
    const emails = req.validatedBody.emails.map(sanitizeInput);

    // Enforce tier batch size limit (admin keys bypass tier limits)
    if (!req.isAdmin && emails.length > req.tierConfig.maxBatchSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_SIZE_EXCEEDED',
          message: `Your ${req.apiKey.tier} tier allows a maximum of ${req.tierConfig.maxBatchSize} emails per request`,
        },
      });
    }

    // Enforce tier daily limit (admin keys bypass tier limits)
    if (!req.isAdmin && req.tierConfig.dailyEmails !== Infinity) {
      const stats = getUsageStats(req.apiKey.id);
      const remaining = req.tierConfig.dailyEmails - stats.today.emails;
      if (emails.length > remaining) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'DAILY_LIMIT_EXCEEDED',
            message: `You have ${remaining} emails remaining in your daily limit. Your ${req.apiKey.tier} tier allows ${req.tierConfig.dailyEmails} emails per day.`,
          },
        });
      }
    }

    const startTime = Date.now();
    const { results, stats } = await validateBulkEmails(emails);
    const duration = Date.now() - startTime;

    logUsage(req.apiKey.id, 'validate/bulk', emails.length, duration);

    res.json({
      success: true,
      data: { results, stats },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;