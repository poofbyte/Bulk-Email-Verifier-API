const { verifyApiKey } = require('../services/keyManager');
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

  if (!apiKey || apiKey !== config.adminKey) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_ADMIN_KEY',
        message: 'Valid admin key required',
      },
    });
  }

  next();
}

module.exports = { authMiddleware, adminAuthMiddleware };
