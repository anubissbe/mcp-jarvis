#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlite3Verbose = sqlite3.verbose();

console.log('🚀 Installing MCP servers and dependencies...\n');

// Create necessary directories
const dirs = [
  '/opt/MCP/data',
  '/opt/MCP/data/puppeteer-profiles',
  '/opt/MCP/logs'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Install npm dependencies
console.log('\n📦 Installing npm packages...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: '/opt/MCP' });
  console.log('✅ NPM packages installed successfully');
} catch (error) {
  console.error('❌ Failed to install npm packages:', error.message);
  process.exit(1);
}

// Make server scripts executable
const serverScripts = fs.readdirSync('/opt/MCP/servers')
  .filter(file => file.endsWith('.js'))
  .map(file => path.join('/opt/MCP/servers', file));

serverScripts.forEach(script => {
  fs.chmodSync(script, '755');
  console.log(`✅ Made executable: ${script}`);
});

// Create initial SQLite databases
console.log('\n🗄️  Initializing SQLite databases...');

const databases = ['main.db', 'analytics.db', 'logs.db'];
databases.forEach(dbName => {
  const dbPath = path.join('/opt/MCP/data', dbName);
  const db = new sqlite3Verbose.Database(dbPath);
  
  db.serialize(() => {
    // Create a sample table
    db.run(`CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`INSERT OR IGNORE INTO metadata (key, value) VALUES ('initialized', 'true')`);
  });
  
  db.close();
  console.log(`✅ Initialized database: ${dbPath}`);
});

console.log('\n✨ Installation complete! All MCP servers are ready to use.');
console.log('\nTo start using the servers, copy the config to your Claude desktop app:');
console.log('  cp /opt/MCP/config/mcp-config.json ~/.config/claude/mcp-config.json');