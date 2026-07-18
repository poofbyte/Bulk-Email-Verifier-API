const { initDb, getDb, saveDb } = require('./database');

async function runMigrations() {
  await initDb();
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT
    )
  `);

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
  db.run('CREATE INDEX IF NOT EXISTS idx_usage_logs_key_id ON usage_logs(api_key_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)');

  saveDb();
}

// Run directly: node src/db/migrations.js
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
