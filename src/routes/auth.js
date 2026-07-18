const express = require('express');
const { z } = require('zod');
const { createUser, verifyUser, findUserByApiKey } = require('../services/userManager');
const { hashKey } = require('../services/keyManager');

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Account created with API key
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/signup', (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }

  const { name, email, password } = result.data;
  const response = createUser(name, email, password);

  if (response.error) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: response.error },
    });
  }

  res.status(201).json({
    success: true,
    data: {
      user: response.user,
      apiKey: response.apiKey,
    },
  });
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful with API key
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }

  const { email, password } = result.data;
  const response = verifyUser(email, password);

  if (response.error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: response.error },
    });
  }

  // Get the actual key value by finding and regenerating
  // Actually we need to get the key prefix - but we can't recover the full key
  // So we need to return the key from the original creation
  // For login, we need to regenerate a new key
  const { getDb, scheduleSave } = require('../db/database');
  const db = getDb();

  // Delete old key and create new one
  if (response.keyId) {
    db.run('UPDATE api_keys SET active = 0 WHERE id = ?', [response.keyId]);
  }

  const { createApiKey } = require('../services/keyManager');
  const newKey = createApiKey(`${response.user.name}'s API Key`, 'free');
  db.run('UPDATE api_keys SET user_id = ? WHERE id = ?', [response.user.id, newKey.id]);
  scheduleSave();

  res.json({
    success: true,
    data: {
      user: response.user,
      apiKey: newKey.key,
    },
  });
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user info
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Invalid API key
 */
router.get('/me', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'MISSING_API_KEY', message: 'X-API-Key header is required' },
    });
  }

  const keyHash = hashKey(apiKey);
  const user = findUserByApiKey(keyHash);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
    });
  }

  res.json({ success: true, data: user });
});

module.exports = router;
