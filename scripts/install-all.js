#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const sqlite3Verbose = sqlite3.verbose();

console.log('🚀 Installing MCP Jarvis servers and dependencies...\n');

// Get paths from environment or use defaults
const DATA_DIR = process.env.MCP_DATA_DIR || path.join(PROJECT_ROOT, 'data');
const LOGS_DIR = process.env.MCP_LOGS_DIR || path.join(PROJECT_ROOT, 'logs');

// Create necessary directories
const dirs = [
  DATA_DIR,
  path.join(DATA_DIR, 'puppeteer-profiles'),
  path.join(DATA_DIR, 'learned-knowledge'),
  path.join(DATA_DIR, 'markmap-output'),
  LOGS_DIR
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
  execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
  console.log('✅ NPM packages installed successfully');
} catch (error) {
  console.error('❌ Failed to install npm packages:', error.message);
  process.exit(1);
}

// Make server scripts executable
const serverScripts = fs.readdirSync(path.join(PROJECT_ROOT, 'servers'))
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(PROJECT_ROOT, 'servers', file));

serverScripts.forEach(script => {
  fs.chmodSync(script, '755');
  console.log(`✅ Made executable: ${path.basename(script)}`);
});

// Create initial SQLite databases
console.log('\n🗄️  Initializing SQLite databases...');

const databases = ['main.db', 'analytics.db', 'logs.db'];
databases.forEach(dbName => {
  const dbPath = path.join(DATA_DIR, dbName);
  const db = new sqlite3Verbose.Database(dbPath);
  
  db.serialize(() => {
    // Create sample tables based on database type
    if (dbName === 'main.db') {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
    }
    
    if (dbName === 'analytics.db') {
      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    }
    
    if (dbName === 'logs.db') {
      db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    }
    
    console.log(`✅ Initialized database: ${dbName}`);
  });
  
  db.close();
});

// Create memory store file
const memoryStorePath = path.join(DATA_DIR, 'memory-store.json');
if (!fs.existsSync(memoryStorePath)) {
  fs.writeFileSync(memoryStorePath, '{}', 'utf8');
  console.log('✅ Created memory store file');
}

// Check for optional dependencies
console.log('\n🔍 Checking optional dependencies...');

// Check for Docker (optional for code sandbox)
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is installed (enables code sandbox features)');
} catch {
  console.log('⚠️  Docker not found (code sandbox features will be limited)');
}

// Check for Deno (optional for Python sandbox)
try {
  execSync('deno --version', { stdio: 'pipe' });
  console.log('✅ Deno is installed (enables Python sandbox)');
} catch {
  console.log('⚠️  Deno not found (Python sandbox will not work)');
  console.log('   To install: curl -fsSL https://deno.land/install.sh | sh');
}

console.log('\n✨ Installation complete!');
console.log('\nQuick start:');
console.log('1. Copy .env.example to .env and configure settings');
console.log('2. Run "node scripts/setup.js" to configure Claude integration');
console.log('3. Restart Claude Desktop to load the MCP servers');
console.log('4. Test with "node scripts/test-servers.js"');

console.log('\n📍 Project location:', PROJECT_ROOT);
console.log('📍 Data directory:', DATA_DIR);