const express = require('express');
const router = express.Router();
const { adminAuthMiddleware } = require('../middleware/auth');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getUserVerificationHistory,
  getDashboardStats,
  getUserApiKey,
  regenerateUserApiKey
} = require('../services/userManager');
const {
  listApiKeys,
  createApiKey,
  deactivateApiKey,
  reactivateApiKey,
  updateKeyTier,
  deleteApiKey
} = require('../services/keyManager');
const config = require('../config');

// Dashboard Stats
router.get('/stats', adminAuthMiddleware, (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// User Management
router.get('/users', adminAuthMiddleware, (req, res) => {
  try {
    const { page = 1, limit = 25, search = null, status = null, tier = null } = req.query;
    const result = listUsers({ page: parseInt(page), limit: parseInt(limit), search, status, tier });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.get('/users/:id', adminAuthMiddleware, (req, res) => {
  try {
    const user = getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.post('/users', adminAuthMiddleware, (req, res) => {
  try {
    const { email, name, password, tier = 'free', is_active = true, is_admin = false } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'MISSING_FIELDS', message: 'Email, name, and password are required' } 
      });
    }
    
    // Check if user already exists
    const existing = listUsers({ search: email, limit: 1 });
    if (existing.data.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' } 
      });
    }
    
    const user = createUser({ email, name, password, tier, is_active, is_admin });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.put('/users/:id', adminAuthMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUserById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    const updates = req.body;
    const updatedUser = updateUser(id, updates);
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.delete('/users/:id', adminAuthMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUserById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Prevent deleting yourself
    if (user.id === req.apiKey.user_id) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'CANNOT_DELETE_SELF', message: 'Cannot delete your own account' } 
      });
    }
    
    deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// User Stats
router.get('/users/:id/stats', adminAuthMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const stats = getUserStats(userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// User API Keys
router.get('/users/:id/keys', adminAuthMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    const keys = listApiKeys().filter(k => k.user_id === userId);
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.get('/users/:id/verification-history', adminAuthMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { page = 1, limit = 50, startDate = null, endDate = null } = req.query;
    
    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    const history = getUserVerificationHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    });
    
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.post('/users/:id/keys', adminAuthMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name = "User's API Key", tier = 'free' } = req.body;
    
    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    const key = createApiKey(name, tier);
    res.status(201).json({ success: true, data: key });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// System Configuration
router.get('/config', adminAuthMiddleware, (req, res) => {
  try {
    const tierConfig = config.tiers;
    const rateLimits = config.rateLimits;
    
    res.json({ 
      success: true, 
      data: { 
        tiers: tierConfig,
        rateLimits,
        adminKeySet: !!process.env.ADMIN_KEY
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.put('/config/ratelimits', adminAuthMiddleware, (req, res) => {
  try {
    const { rateLimits } = req.body;
    
    if (rateLimits) {
      // Update rate limits config
      for (const [tier, limits] of Object.entries(rateLimits)) {
        if (config.tiers[tier]) {
          config.tiers[tier].rateLimit = limits.requestsPerMinute;
          config.tiers[tier].batchSize = limits.maxBatchSize;
          config.tiers[tier].dailyEmails = limits.dailyEmails;
        }
      }
    }
    
    res.json({ success: true, message: 'Rate limits updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;