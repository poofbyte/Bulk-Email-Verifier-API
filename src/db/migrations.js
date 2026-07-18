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
  const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='api_keys'");
  const tableExists = tableCheck.length > 0 && tableCheck[0].values.length > 0;

  if (!tableExists) {
    // New database - create table with user_id
    db.run(`
      CREATE TABLE api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT UNIQUE NOT NULL,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'free',
        active INTEGER NOT NULL DEFAULT 1,
        user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_used_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } else {
    // Existing database - check if user_id column exists
    const columns = db.exec("PRAGMA table_info(api_keys)");
    const hasUserId = columns.length > 0 && columns[0].values.some((row) => row[1] === 'user_id');
    if (!hasUserId) {
      db.run('ALTER TABLE api_keys ADD COLUMN user_id INTEGER');
    }
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

  db.run('CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)');
  db.run('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_usage_logs_key_id ON usage_logs(api_key_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)');

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
