const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;
let saving = false;

async function initDb() {
  if (db) return db;

  const dir = path.dirname(config.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// Auto-save to disk periodically and on changes
function scheduleSave() {
  if (saving) return;
  saving = true;
  setImmediate(() => {
    try {
      if (!db) return;
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(config.dbPath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    } finally {
      saving = false;
    }
  });
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

module.exports = { initDb, getDb, saveDb, closeDb, scheduleSave };
