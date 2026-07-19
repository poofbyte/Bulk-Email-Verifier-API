const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getDb, scheduleSave } = require('../db/database');
const { createApiKey, getApiKeyIdByRawKey } = require('./keyManager');

const SALT_ROUNDS = 10;

// User CRUD Operations

function createUser({ email, name, password, tier = 'free', is_active = true, is_admin = false }) {
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  
  const db = getDb();
  const result = db.run(
    'INSERT INTO users (email, name, password_hash, tier, is_active, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
    [email, name, passwordHash, tier, is_active ? 1 : 0, is_admin ? 1 : 0]
  );
  
  const userId = result.lastInsertRowid;
  
  // Create API key for the user
  const rawKey = 'bev_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);
  
  db.run(
    'INSERT INTO api_keys (key_hash, key_prefix, raw_key, name, tier, user_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [keyHash, keyPrefix, rawKey, `${name}'s API Key`, tier, userId, 1]
  );
  
  scheduleSave();
  
  return {
    id: userId,
    email,
    name,
    tier,
    isActive: !!is_active,
    isAdmin: !!is_admin,
    createdAt: new Date().toISOString(),
    apiKey: rawKey,
    apiKeyPrefix: keyPrefix
  };
}

function getUserById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  
  let user = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    user = {};
    cols.forEach((c, i) => { user[c] = vals[i]; });
  }
  stmt.free();
  
  return user;
}

function getUserByEmail(email) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  
  let user = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    user = {};
    cols.forEach((c, i) => { user[c] = vals[i]; });
  }
  stmt.free();
  
  return user;
}

function getUserWithKeys(email) {
  const db = getDb();
  const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
  userStmt.bind([email]);
  
  let user = null;
  if (userStmt.step()) {
    const cols = userStmt.getColumnNames();
    const vals = userStmt.get();
    user = {};
    cols.forEach((c, i) => { user[c] = vals[i]; });
    
    // Get user's API keys
    const keyStmt = db.prepare('SELECT id, key_prefix, name, tier, active, created_at, last_used_at FROM api_keys WHERE user_id = ?');
    keyStmt.bind([user.id]);
    
    let keys = [];
    while (keyStmt.step()) {
      const keyCols = keyStmt.getColumnNames();
      const keyVals = keyStmt.get();
      const key = {};
      keyCols.forEach((c, i) => { key[c] = keyVals[i]; });
      keys.push(key);
    }
    keyStmt.free();
    user.apiKeys = keys;
  }
  userStmt.free();
  
  return user;
}

function listUsers({ page = 1, limit = 25, search = null, status = null, tier = null }) {
  const db = getDb();
  let sql = 'SELECT id, email, name, tier, is_active, is_admin, created_at, last_login_at FROM users';
  let countSql = 'SELECT COUNT(*) as total FROM users';
  const params = [];
  const whereClauses = [];
  
  if (search) {
    whereClauses.push('(email LIKE ? OR name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (status === 'active') {
    whereClauses.push('is_active = 1');
  } else if (status === 'inactive') {
    whereClauses.push('is_active = 0');
  }
  
  if (tier) {
    whereClauses.push('tier = ?');
    params.push(tier);
  }
  
  if (whereClauses.length > 0) {
    const whereClause = ' WHERE ' + whereClauses.join(' AND ');
    sql += whereClause;
    countSql += whereClause;
  }
  
  // Get total count
  const countStmt = db.prepare(countSql);
  countStmt.bind(params);
  let totalCount = 0;
  if (countStmt.step()) {
    totalCount = countStmt.get()[0];
  }
  countStmt.free();
  
  // Get users with pagination
  const offset = (page - 1) * limit;
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const users = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const user = {};
    cols.forEach((c, i) => { user[c] = vals[i]; });
    users.push(user);
  }
  stmt.free();
  
  return {
    data: users,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

function updateUser(id, updates) {
  const db = getDb();
  
  const allowedFields = ['email', 'name', 'tier', 'is_active', 'daily_limit', 'monthly_limit', 'updated_at'];
  const setClauses = [];
  const params = [];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }
  
  if (setClauses.length === 0) {
    return getUserById(id);
  }
  
  params.push(id);
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
  
  db.run(sql, params);
  scheduleSave();
  
  return getUserById(id);
}

function deleteUser(id) {
  const db = getDb();
  
  // Delete user's API keys first
  db.run('DELETE FROM api_keys WHERE user_id = ?', [id]);
  
  // Delete usage logs
  db.run('DELETE FROM usage_logs WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = ?)', [id]);
  
  // Delete user
  db.run('DELETE FROM users WHERE id = ?', [id]);
  
  scheduleSave();
}

function verifyPassword(email, password) {
  const user = getUserByEmail(email);
  if (!user) return null;
  
  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) return null;
  
  // Update last login
  const db = getDb();
  db.run('UPDATE users SET last_login_at = datetime("now") WHERE id = ?', [user.id]);
  scheduleSave();
  
  return user;
}

function changePassword(userId, oldPassword, newPassword) {
  const user = getUserById(userId);
  if (!user) return false;
  
  const isValid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!isValid) return false;
  
  const newHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  const db = getDb();
  db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
  scheduleSave();
  
  return true;
}

// API Key management for users

function getUserApiKey(userId) {
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

function regenerateUserApiKey(userId) {
  const db = getDb();
  
  // Deactivate old key
  db.run('UPDATE api_keys SET active = 0 WHERE user_id = ?', [userId]);
  
  // Create new key
  const rawKey = 'bev_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);
  
  db.run(
    'INSERT INTO api_keys (key_hash, key_prefix, raw_key, name, tier, user_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [keyHash, keyPrefix, rawKey, 'New API Key', 'free', userId, 1]
  );
  
  scheduleSave();
  
  return rawKey;
}

// Usage statistics

function getUserStats(userId) {
  const db = getDb();
  
  // Today's stats
  const todayStmt = db.prepare(`
    SELECT COALESCE(SUM(ul.emails_validated), 0) as emails, COUNT(*) as requests
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.user_id = ? AND ul.created_at >= date('now')
  `);
  todayStmt.bind([userId]);
  
  let todayStats = { emails: 0, requests: 0 };
  if (todayStmt.step()) {
    todayStats = todayStmt.get();
  }
  todayStmt.free();
  
  // All-time stats
  const allTimeStmt = db.prepare(`
    SELECT COALESCE(SUM(ul.emails_validated), 0) as emails, COUNT(*) as requests
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.user_id = ?
  `);
  allTimeStmt.bind([userId]);
  
  let allTimeStats = { emails: 0, requests: 0 };
  if (allTimeStmt.step()) {
    allTimeStats = allTimeStmt.get();
  }
  allTimeStmt.free();
  
  return { today: todayStats, allTime: allTimeStats };
}

// Admin dashboard stats

function getUserVerificationHistory(userId, { page = 1, limit = 50, startDate = null, endDate = null }) {
  const db = getDb();
  let sql = `
    SELECT ul.id, ul.endpoint, ul.emails_validated, ul.duration_ms, ul.created_at,
           ak.id as api_key_id, ak.name as key_name, ak.key_prefix
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.user_id = ?
  `;
  const params = [userId];
  
  if (startDate) {
    sql += ' AND ul.created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND ul.created_at <= ?';
    params.push(endDate);
  }
  
  sql += ' ORDER BY ul.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);
  
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const logs = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const log = {};
    cols.forEach((c, i) => { log[c] = vals[i]; });
    logs.push(log);
  }
  stmt.free();
  
  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.user_id = ?
  `;
  const countStmt = db.prepare(countSql);
  countStmt.bind([userId]);
  let totalCount = 0;
  if (countStmt.step()) {
    totalCount = countStmt.get()[0];
  }
  countStmt.free();
  
  return {
    data: logs,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

function getDashboardStats() {
  const db = getDb();
  
  // Total users
  const totalUsersStmt = db.prepare('SELECT COUNT(*) as total FROM users');
  totalUsersStmt.bind([]);
  let totalUsers = 0;
  if (totalUsersStmt.step()) {
    totalUsers = totalUsersStmt.get()[0];
  }
  totalUsersStmt.free();
  
  // Active users
  const activeUsersStmt = db.prepare('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
  activeUsersStmt.bind([]);
  let activeUsers = 0;
  if (activeUsersStmt.step()) {
    activeUsers = activeUsersStmt.get()[0];
  }
  activeUsersStmt.free();
  
  // Admin users
  const adminUsersStmt = db.prepare('SELECT COUNT(*) as total FROM users WHERE is_admin = 1');
  adminUsersStmt.bind([]);
  let adminUsers = 0;
  if (adminUsersStmt.step()) {
    adminUsers = adminUsersStmt.get()[0];
  }
  adminUsersStmt.free();
  
  // Total API keys
  const totalKeysStmt = db.prepare('SELECT COUNT(*) as total FROM api_keys');
  totalKeysStmt.bind([]);
  let totalKeys = 0;
  if (totalKeysStmt.step()) {
    totalKeys = totalKeysStmt.get()[0];
  }
  totalKeysStmt.free();
  
  // Active API keys
  const activeKeysStmt = db.prepare('SELECT COUNT(*) as total FROM api_keys WHERE active = 1');
  activeKeysStmt.bind([]);
  let activeKeys = 0;
  if (activeKeysStmt.step()) {
    activeKeys = activeKeysStmt.get()[0];
  }
  activeKeysStmt.free();
  
  // Today's usage
  const todayUsageStmt = db.prepare(`
    SELECT COALESCE(SUM(ul.emails_validated), 0) as emails, COUNT(*) as requests
    FROM usage_logs ul
  `);
  todayUsageStmt.bind([]);
  let todayUsage = { emails: 0, requests: 0 };
  if (todayUsageStmt.step()) {
    todayUsage = todayUsageStmt.get();
  }
  todayUsageStmt.free();
  
  // Tier distribution
  const tierStmt = db.prepare(`
    SELECT tier, COUNT(*) as count
    FROM users
    GROUP BY tier
  `);
  tierStmt.bind([]);
  const tiers = [];
  while (tierStmt.step()) {
    const cols = tierStmt.getColumnNames();
    const vals = tierStmt.get();
    const tier = {};
    cols.forEach((c, i) => { tier[c] = vals[i]; });
    tiers.push(tier);
  }
  tierStmt.free();
  
  return {
    users: { total: totalUsers, active: activeUsers, admins: adminUsers },
    apiKeys: { total: totalKeys, active: activeKeys },
    usage: { today: todayUsage },
    distribution: { tiers }
  };
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUserWithKeys,
  listUsers,
  updateUser,
  deleteUser,
  verifyPassword,
  changePassword,
  getUserApiKey,
  regenerateUserApiKey,
  getUserStats,
  getUserVerificationHistory,
  getDashboardStats
};
