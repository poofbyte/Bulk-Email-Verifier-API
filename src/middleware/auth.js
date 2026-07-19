const { verifyApiKey, getTierForApiKey } = require('../services/keyManager');
const config = require('../config');

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'X-API-Key header is required',
      },
    });
  }

  const keyData = verifyApiKey(apiKey);
  if (!keyData) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid or inactive API key',
      },
    });
  }

  req.apiKey = keyData;
  req.tierConfig = config.tiers[keyData.tier] || config.tiers.free;
  next();
}

function adminAuthMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'X-API-Key header is required',
      },
    });
  }

  const keyData = verifyApiKey(apiKey);
  
  // Admin key must be from an admin user or match the ADMIN_KEY environment variable
  // Check if this key belongs to an admin user (user_id > 0 and is admin)
  // For simplicity, check if the key matches the raw ADMIN_KEY env var
  if (apiKey !== config.adminKey) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_ADMIN_KEY',
        message: 'Valid admin key required',
      },
    });
  }

  // Verify the admin key is actually valid in the database
  const keyDataDb = verifyApiKey(apiKey);
  if (!keyDataDb) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_KEY_NOT_FOUND',
        message: 'Admin key not found in database',
      },
    });
  }

  req.apiKey = keyDataDb;
  req.isAdmin = true;
  req.tierConfig = config.tiers[keyDataDb.tier] || config.tiers.free;
  next();
}

module.exports = { authMiddleware, adminAuthMiddleware };