#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 MCP Server Setup Utility\n');

// Check if running as root (recommended for system-wide setup)
if (process.getuid && process.getuid() !== 0) {
  console.warn('⚠️  Warning: Not running as root. Some operations may fail.');
}

// Detect Claude configuration directory
const homeDir = os.homedir();
const claudeConfigPaths = [
  path.join(homeDir, '.config', 'claude'),
  path.join(homeDir, 'Library', 'Application Support', 'Claude'), // macOS
  path.join(homeDir, 'AppData', 'Roaming', 'Claude') // Windows
];

let claudeConfigDir = null;
for (const configPath of claudeConfigPaths) {
  if (fs.existsSync(configPath)) {
    claudeConfigDir = configPath;
    break;
  }
}

if (!claudeConfigDir) {
  // Create default config directory
  claudeConfigDir = claudeConfigPaths[0];
  fs.mkdirSync(claudeConfigDir, { recursive: true });
  console.log(`✅ Created Claude config directory: ${claudeConfigDir}`);
} else {
  console.log(`✅ Found Claude config directory: ${claudeConfigDir}`);
}

// Copy MCP configuration
const sourceConfig = '/opt/MCP/config/mcp-config.json';
const targetConfig = path.join(claudeConfigDir, 'mcp-config.json');

// Backup existing config if it exists
if (fs.existsSync(targetConfig)) {
  const backupPath = `${targetConfig}.backup-${Date.now()}`;
  fs.copyFileSync(targetConfig, backupPath);
  console.log(`📋 Backed up existing config to: ${backupPath}`);
}

// Merge or copy configuration
if (fs.existsSync(targetConfig)) {
  console.log('🔀 Merging with existing configuration...');
  
  const existingConfig = JSON.parse(fs.readFileSync(targetConfig, 'utf8'));
  const newConfig = JSON.parse(fs.readFileSync(sourceConfig, 'utf8'));
  
  // Merge mcpServers
  existingConfig.mcpServers = {
    ...existingConfig.mcpServers,
    ...newConfig.mcpServers
  };
  
  fs.writeFileSync(targetConfig, JSON.stringify(existingConfig, null, 2));
  console.log('✅ Configuration merged successfully');
} else {
  fs.copyFileSync(sourceConfig, targetConfig);
  console.log('✅ Configuration copied successfully');
}

// Create systemd service files (Linux only)
if (process.platform === 'linux') {
  console.log('\n🐧 Creating systemd service files...');
  
  const serviceTemplate = (name) => `[Unit]
Description=MCP ${name} Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/MCP/servers/${name}-server.js
Restart=on-failure
User=nobody
Group=nogroup
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

  const servers = ['filesystem', 'fetch', 'memory', 'git', 'sqlite', 'puppeteer'];
  
  servers.forEach(server => {
    const serviceFile = `/etc/systemd/system/mcp-${server}.service`;
    try {
      fs.writeFileSync(serviceFile, serviceTemplate(server));
      console.log(`✅ Created service: mcp-${server}.service`);
    } catch (error) {
      console.warn(`⚠️  Could not create ${serviceFile}: ${error.message}`);
    }
  });
}

console.log('\n✨ Setup complete!');
console.log('\nNext steps:');
console.log('1. Run "node /opt/MCP/scripts/install-all.js" to install dependencies');
console.log('2. Restart Claude desktop app to load the new servers');
console.log('3. Test the servers with "node /opt/MCP/scripts/test-servers.js"');