const { initDb, getDb, saveDb } = require('./database');

async function runMigrations() {
  await initDb();
  const db = getDb();

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // API Keys table - handle migration for existing databases
  // Added raw_key column to store the full API key for login retrieval
  try {
    db.run(`
      CREATE TABLE api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT UNIQUE NOT NULL,
        key_prefix TEXT NOT NULL,
        raw_key TEXT NOT NULL,
        name TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'free',
        active INTEGER NOT NULL DEFAULT 1,
        user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_used_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } catch (e) {
    // Table might already exist, try adding columns
    try {
      db.run('ALTER TABLE api_keys ADD COLUMN user_id INTEGER');
    } catch {}
    try {
      db.run('ALTER TABLE api_keys ADD COLUMN raw_key TEXT');
    } catch {}
  }

  // Usage logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      emails_validated INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    )
  `);

  // Indexes (ignore errors if they already exist)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)',
    'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_api_keys_raw_key ON api_keys(raw_key)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_usage_logs_key_id ON usage_logs(api_key_id)',
    'CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)',
  ];
  for (const idx of indexes) {
    try { db.run(idx); } catch {}
  }

  saveDb();
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };