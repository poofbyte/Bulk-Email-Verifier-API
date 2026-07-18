const express = require('express');
const { adminAuthMiddleware } = require('../middleware/auth');
const {
  createApiKey,
  listApiKeys,
  deactivateApiKey,
  reactivateApiKey,
  updateKeyTier,
  deleteApiKey,
} = require('../services/keyManager');

const router = express.Router();

// All admin routes require the admin key
router.use(adminAuthMiddleware);

/**
 * @swagger
 * /api/v1/admin/keys:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new API key
 *     security:
 *       - AdminKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [free, pro, enterprise]
 *                 default: free
 *     responses:
 *       201:
 *         description: API key created
 */
router.post('/keys', (req, res) => {
  const { name, tier = 'free' } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Name is required' },
    });
  }

  if (!['free', 'pro', 'enterprise'].includes(tier)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TIER', message: 'Tier must be free, pro, or enterprise' },
    });
  }

  const key = createApiKey(name.trim(), tier);

  res.status(201).json({
    success: true,
    data: {
      id: key.id,
      key: key.key,
      keyPrefix: key.keyPrefix,
      name: key.name,
      tier: key.tier,
    },
    message: 'Save this API key - it will not be shown again',
  });
});

/**
 * @swagger
 * /api/v1/admin/keys:
 *   get:
 *     tags: [Admin]
 *     summary: List all API keys
 *     security:
 *       - AdminKeyAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/keys', (req, res) => {
  const keys = listApiKeys();
  res.json({ success: true, data: keys });
});

/**
 * @swagger
 * /api/v1/admin/keys/{id}/deactivate:
 *   post:
 *     tags: [Admin]
 *     summary: Deactivate an API key
 *     security:
 *       - AdminKeyAuth: []
 */
router.post('/keys/:id/deactivate', (req, res) => {
  deactivateApiKey(req.params.id);
  res.json({ success: true, message: 'Key deactivated' });
});

/**
 * @swagger
 * /api/v1/admin/keys/{id}/reactivate:
 *   post:
 *     tags: [Admin]
 *     summary: Reactivate an API key
 *     security:
 *       - AdminKeyAuth: []
 */
router.post('/keys/:id/reactivate', (req, res) => {
  reactivateApiKey(req.params.id);
  res.json({ success: true, message: 'Key reactivated' });
});

/**
 * @swagger
 * /api/v1/admin/keys/{id}/tier:
 *   put:
 *     tags: [Admin]
 *     summary: Update an API key's tier
 *     security:
 *       - AdminKeyAuth: []
 */
router.put('/keys/:id/tier', (req, res) => {
  const { tier } = req.body;

  if (!['free', 'pro', 'enterprise'].includes(tier)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TIER', message: 'Tier must be free, pro, or enterprise' },
    });
  }

  updateKeyTier(req.params.id, tier);
  res.json({ success: true, message: `Tier updated to ${tier}` });
});

/**
 * @swagger
 * /api/v1/admin/keys/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete an API key
 *     security:
 *       - AdminKeyAuth: []
 */
router.delete('/keys/:id', (req, res) => {
  deleteApiKey(req.params.id);
  res.json({ success: true, message: 'Key deleted' });
});

module.exports = router;
