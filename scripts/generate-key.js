#!/usr/bin/env node

/**
 * CLI tool to generate and manage API keys.
 *
 * Usage:
 *   node scripts/generate-key.js create <name> [tier]
 *   node scripts/generate-key.js list
 *   node scripts/generate-key.js deactivate <id>
 *   node scripts/generate-key.js reactivate <id>
 */

const path = require('path');

// Ensure we're in the project root
process.chdir(path.join(__dirname, '..'));

// Force local SQLite for CLI operations
process.env.TURSO_DATABASE_URL = '';

const { initDb, getDb, saveDb } = require('../src/db/database');
const {
  createApiKey,
  listApiKeys,
  deactivateApiKey,
  reactivateApiKey,
} = require('../src/services/keyManager');

function printKey(keyData) {
  console.log('\n========================================');
  console.log('  API Key Created Successfully');
  console.log('========================================');
  console.log(`  ID:      ${keyData.id}`);
  console.log(`  Name:    ${keyData.name}`);
  console.log(`  Tier:    ${keyData.tier}`);
  console.log(`  Prefix:  ${keyData.keyPrefix}...`);
  console.log(`  Key:     ${keyData.key}`);
  console.log('----------------------------------------');
  console.log('  SAVE THIS KEY - It will not be shown again!');
  console.log('  Use header: X-API-Key: ' + keyData.key);
  console.log('========================================\n');
}

function printKeys(keys) {
  if (keys.length === 0) {
    console.log('No API keys found.');
    return;
  }

  console.log('\nAPI Keys:');
  console.log('\u2500'.repeat(80));
  console.log(
    'ID'.padEnd(5),
    'Prefix'.padEnd(15),
    'Name'.padEnd(25),
    'Tier'.padEnd(12),
    'Active'.padEnd(8),
    'Created'
  );
  console.log('\u2500'.repeat(80));

  for (const key of keys) {
    console.log(
      String(key.id).padEnd(5),
      key.key_prefix.padEnd(15),
      key.name.padEnd(25),
      key.tier.padEnd(12),
      (key.active ? 'Yes' : 'No').padEnd(8),
      key.created_at
    );
  }
  console.log('\u2500'.repeat(80));
  console.log(`Total: ${keys.length} keys\n`);
}

async function main() {
  await initDb();

  const [,, command, ...args] = process.argv;

  switch (command) {
    case 'create': {
      const [name, tier] = args;
      if (!name) {
        console.error('Usage: node scripts/generate-key.js create <name> [tier]');
        console.error('Tiers: free, pro, enterprise');
        process.exit(1);
      }
      const validTiers = ['free', 'pro', 'enterprise'];
      const keyTier = tier && validTiers.includes(tier) ? tier : 'free';
      const key = createApiKey(name, keyTier);
      printKey(key);
      break;
    }

    case 'list': {
      const keys = listApiKeys();
      printKeys(keys);
      break;
    }

    case 'deactivate': {
      const [id] = args;
      if (!id) {
        console.error('Usage: node scripts/generate-key.js deactivate <id>');
        process.exit(1);
      }
      deactivateApiKey(id);
      console.log(`Key ${id} deactivated.`);
      break;
    }

    case 'reactivate': {
      const [id] = args;
      if (!id) {
        console.error('Usage: node scripts/generate-key.js reactivate <id>');
        process.exit(1);
      }
      reactivateApiKey(id);
      console.log(`Key ${id} reactivated.`);
      break;
    }

    default:
      console.log(`
Bulk Email Verifier API - Key Management CLI

Commands:
  create <name> [tier]    Create a new API key (tier: free|pro|enterprise)
  list                    List all API keys
  deactivate <id>         Deactivate an API key
  reactivate <id>         Reactivate an API key

Examples:
  node scripts/generate-key.js create "My App" free
  node scripts/generate-key.js create "Production" pro
  node scripts/generate-key.js list
`);
      break;
  }

  saveDb();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
