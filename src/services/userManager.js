const bcrypt = require('bcryptjs');
const { getDb, scheduleSave } = require('../db/database');
const { createApiKey, hashKey, verifyApiKey, getApiKeyByUserId } = require('./keyManager');

const SALT_ROUNDS = 12;

function createUser(name, email, password) {
  const db = getDb();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  // Check if email already exists
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  stmt.bind([email]);
  if (stmt.step()) {
    stmt.free();
    return { error: 'Email already registered' };
  }
  stmt.free();

  db.run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash]);
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const userId = idResult[0].values[0][0];

  // Create an API key for the new user
  const keyData = createApiKey(`${name}'s API Key`, 'free');
  db.run('UPDATE api_keys SET user_id = ? WHERE id = ?', [userId, keyData.id]);
  scheduleSave();

  return {
    user: { id: userId, name, email },
    apiKey: keyData.key,
  };
}

function verifyUser(email, password) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
  stmt.bind([email]);

  let row = null;
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
  }
  stmt.free();

  if (!row) return { error: 'Invalid email or password' };

  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) return { error: 'Invalid email or password' };

  // FIXED: Get the existing API key for this user (returns the raw key)
  const apiKey = getApiKeyByUserId(row.id);
  
  return {
    user: { id: row.id, name: row.name, email: row.email },
    apiKey: apiKey,
  };
}

function findUserByApiKey(keyHash) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email
    FROM users u
    JOIN api_keys ak ON ak.user_id = u.id
    WHERE ak.key_hash = ?
  `);
  stmt.bind([keyHash]);

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

module.exports = { createUser, verifyUser, findUserByApiKey };