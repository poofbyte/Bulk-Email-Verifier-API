const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;
let dbType = 'sql.js'; // 'sql.js' or 'turso'

// --- Turso (production) ---
let tursoClient = null;

async function initTurso() {
  const { createClient } = require('@libsql/client');
  tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  dbType = 'turso';
  db = createTursoAdapter(tursoClient);
  return db;
}

function createTursoAdapter(client) {
  // Adapter that wraps Turso to match sql.js API surface used by our code
  return {
    run(sql, params = []) {
      client.execute({ sql, args: params });
    },
    exec(sql) {
      // exec returns results like sql.js: [{ columns: [...], values: [[...], ...] }]
      const stmts = sql.split(';').filter(s => s.trim());
      const results = [];
      for (const stmt of stmts) {
        if (!stmt.trim()) continue;
        try {
          const r = client.prepare(stmt.trim());
          // For DDL/DML, we don't need results
        } catch {}
      }
      return results;
    },
    prepare(sql) {
      // Return a sync-compatible wrapper for Turso prepared statements
      let boundArgs = [];
      let lastResult = null;

      const stmt = {
        bind(args) {
          boundArgs = args || [];
          return stmt;
        },
        step() {
          // Execute and cache result
          lastResult = client.prepare(sql).all({ args: boundArgs });
          return lastResult.rows && lastResult.rows.length > 0;
        },
        get() {
          if (lastResult && lastResult.rows && lastResult.rows.length > 0) {
            return Object.values(lastResult.rows[0]);
          }
          return null;
        },
        getColumnNames() {
          if (lastResult && lastResult.columns) {
            return lastResult.columns;
          }
          return [];
        },
        free() {
          lastResult = null;
        },
      };
      return stmt;
    },
    export() {
      return null; // Turso doesn't need export
    },
    close() {
      // Turso client doesn't have a sync close
    },
  };
}

// --- sql.js (local development) ---
async function initSqlJs() {
  const initSqlJsModule = require('sql.js');
  const dir = path.dirname(config.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJsModule();
  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

// --- Unified init ---
async function initDb() {
  if (db) return db;

  // Use Turso if URL is provided
  if (process.env.TURSO_DATABASE_URL) {
    return initTurso();
  }

  // Otherwise use local sql.js
  return initSqlJs();
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// Auto-save (only needed for sql.js)
function scheduleSave() {
  if (dbType === 'turso') return; // Turso saves automatically
  if (!db) return;
  setImmediate(() => {
    try {
      const data = db.export();
      if (!data) return;
      const buffer = Buffer.from(data);
      fs.writeFileSync(config.dbPath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  });
}

function saveDb() {
  if (dbType === 'turso') return;
  if (!db) return;
  const data = db.export();
  if (!data) return;
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

function closeDb() {
  if (db) {
    saveDb();
    if (dbType === 'sql.js') db.close();
    db = null;
  }
}

module.exports = { initDb, getDb, saveDb, closeDb, scheduleSave };
