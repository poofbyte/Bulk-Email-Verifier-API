const crypto = require('crypto');
const { getDb, scheduleSave } = require('../db/database');

const KEY_LENGTH = 48;

function generateRawKey() {
  // Improved key generation with higher entropy using crypto.randomUUID() mixed with random bytes
  const randomId = crypto.randomUUID().replace(/-/g, '');
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return 'bev_' + randomId + randomBytes;
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getPrefix(key) {
  return key.substring(0, 12);
}

function createApiKey(name, tier = 'free') {
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = getPrefix(rawKey);

  const db = getDb();
  db.run(
    'INSERT INTO api_keys (key_hash, key_prefix, raw_key, name, tier) VALUES (?, ?, ?, ?, ?)',
    [keyHash, keyPrefix, rawKey, name, tier]
  );

  const row = db.exec('SELECT last_insert_rowid() as id');
  const id = row[0].values[0][0];

  scheduleSave();

  return { id, key: rawKey, keyPrefix, name, tier };
}

function verifyApiKey(rawKey) {
  if (!rawKey) return null;

  const keyHash = hashKey(rawKey);
  const db = getDb();

  const stmt = db.prepare(
    'SELECT id, key_prefix, name, tier, active, raw_key FROM api_keys WHERE key_hash = ?'
  );
  stmt.bind([keyHash]);

  let row = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
  }
  stmt.free();

  if (!row || !row.active) return null;

  db.run("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?", [row.id]);
  scheduleSave();

  return row;
}

function listApiKeys() {
  const db = getDb();
  const result = db.exec(
    'SELECT id, key_prefix, name, tier, active, created_at, last_used_at FROM api_keys ORDER BY created_at DESC'
  );

  if (result.length === 0) return [];

  const cols = result[0].columns;
  return result[0].values.map((vals) => {
    const row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    return row;
  });
}

function deactivateApiKey(id) {
  const db = getDb();
  db.run('UPDATE api_keys SET active = 0 WHERE id = ?', [id]);
  scheduleSave();
}

function reactivateApiKey(id) {
  const db = getDb();
  db.run('UPDATE api_keys SET active = 1 WHERE id = ?', [id]);
  scheduleSave();
}

function updateKeyTier(id, tier) {
  const db = getDb();
  db.run('UPDATE api_keys SET tier = ? WHERE id = ?', [tier, id]);
  scheduleSave();
}

function deleteApiKey(id) {
  const db = getDb();
  db.run('DELETE FROM usage_logs WHERE api_key_id = ?', [id]);
  db.run('DELETE FROM api_keys WHERE id = ?', [id]);
  scheduleSave();
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  let row = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
  }
  stmt.free();
  return row;
}

function getUsageStats(apiKeyId) {
  const today = queryOne(
    `SELECT COALESCE(SUM(emails_validated), 0) as emails, COUNT(*) as requests
     FROM usage_logs WHERE api_key_id = ? AND created_at >= date('now')`,
    [apiKeyId]
  );

  const allTime = queryOne(
    `SELECT COALESCE(SUM(emails_validated), 0) as emails, COUNT(*) as requests
     FROM usage_logs WHERE api_key_id = ?`,
    [apiKeyId]
  );

  return {
    today: { emails: today.emails, requests: today.requests },
    allTime: { emails: allTime.emails, requests: allTime.requests },
  };
}

function logUsage(apiKeyId, endpoint, emailsValidated, durationMs) {
  const db = getDb();
  db.run(
    'INSERT INTO usage_logs (api_key_id, endpoint, emails_validated, duration_ms) VALUES (?, ?, ?, ?)',
    [apiKeyId, endpoint, emailsValidated, durationMs]
  );
  scheduleSave();
}

// Check daily email limit for an API key
function checkDailyLimit(apiKeyId, emailsToAdd) {
  const todayStats = getUsageStats(apiKeyId);
  const tier = getTierForApiKey(apiKeyId);
  const dailyLimit = tier.dailyEmails;
  
  if (dailyLimit === Infinity) return true;
  
  const currentUsage = todayStats.today.emails;
  return (currentUsage + emailsToAdd) <= dailyLimit;
}

// Get tier config for an API key
function getTierForApiKey(apiKeyId) {
  const db = getDb();
  const keyStmt = db.prepare(
    'SELECT tier FROM api_keys WHERE id = ?'
  );
  keyStmt.bind([apiKeyId]);
  let tier = 'free';
  if (keyStmt.step()) {
    tier = keyStmt.get()[0];
  }
  keyStmt.free();
  const config = require('../config');
  return config.tiers[tier] || config.tiers.free;
}

// Get API key by user ID (returns the raw key)
function getApiKeyByUserId(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT raw_key FROM api_keys WHERE user_id = ? AND active = 1 LIMIT 1');
  stmt.bind([userId]);
  
  let apiKey = null;
  if (stmt.step()) {
    apiKey = stmt.get()[0];
  }
  stmt.free();
  
  return apiKey;
}

// Get API key ID by raw key
function getApiKeyIdByRawKey(rawKey) {
  const keyHash = hashKey(rawKey);
  const db = getDb();
  const stmt = db.prepare('SELECT id FROM api_keys WHERE key_hash = ?');
  stmt.bind([keyHash]);
  
  let keyId = null;
  if (stmt.step()) {
    keyId = stmt.get()[0];
  }
  stmt.free();
  
  return keyId;
}

module.exports = {
  generateRawKey,
  hashKey,
  createApiKey,
  verifyApiKey,
  listApiKeys,
  deactivateApiKey,
  reactivateApiKey,
  updateKeyTier,
  deleteApiKey,
  getUsageStats,
  logUsage,
  checkDailyLimit,
  getTierForApiKey,
  getApiKeyByUserId,
  getApiKeyIdByRawKey,
};