#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🔧 MCP IDE Configuration Generator\n');

const servers = [
  'filesystem', 'fetch', 'memory', 'git', 'sqlite', 'puppeteer',
  'webSearch', 'docker', 'systemMonitor', 'time', 'nodeSandbox',
  'pythonSandbox', 'selfLearning', 'imageGeneration', 'calculator',
  'markmap', 'everything', 'sequentialThinking', 'sequentialThinkingTools'
];

// Base server configuration
const baseServerConfig = (name, file) => ({
  type: "stdio",
  command: "node",
  args: [path.join(PROJECT_ROOT, 'servers', file || `${name}-server.js`)],
  env: {
    NODE_ENV: "production"
  }
});

// Generate VSCode/Cursor config
const vscodeConfig = {
  servers: {}
};

servers.forEach(server => {
  const serverName = server.replace(/-/g, '');
  let fileName = `${server}-server.js`;
  
  // Special cases
  if (server === 'webSearch') fileName = 'web-search-server.js';
  if (server === 'systemMonitor') fileName = 'system-monitor-server.js';
  if (server === 'nodeSandbox') fileName = 'node-sandbox-server.js';
  if (server === 'pythonSandbox') fileName = 'python-sandbox-server.js';
  if (server === 'selfLearning') fileName = 'self-learning-server.js';
  if (server === 'imageGeneration') fileName = 'image-gen-server.js';
  if (server === 'sequentialThinking') fileName = 'sequential-thinking-server.js';
  if (server === 'sequentialThinkingTools') fileName = 'sequential-thinking-tools-server.js';
  
  // Check if server file exists
  const serverPath = path.join(PROJECT_ROOT, 'servers', fileName);
  if (fs.existsSync(serverPath)) {
    vscodeConfig.servers[serverName] = baseServerConfig(server, fileName);
  }
});

// Special handling for npx-based servers
vscodeConfig.servers.calculator = {
  type: "stdio",
  command: "npx",
  args: ["-y", "@wrtnlabs/calculator-mcp"]
};

vscodeConfig.servers.markmap = {
  type: "stdio",
  command: "npx",
  args: ["-y", "@jinzcdev/markmap-mcp-server", "--output", "./data/markmap-output"]
};

// Generate configs for different IDEs
const configs = {
  // VSCode config
  '.vscode/mcp.json': JSON.stringify(vscodeConfig, null, 2),
  
  // Cursor config (same as VSCode)
  '.cursor/mcp.json': JSON.stringify(vscodeConfig, null, 2),
  
  // Global user config for Visual Studio/others
  'mcp-global.json': JSON.stringify(vscodeConfig, null, 2)
};

// Create directories and write configs
Object.entries(configs).forEach(([filePath, content]) => {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write config file
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Generated: ${filePath}`);
});

// Generate a combined settings snippet for user settings.json
const settingsSnippet = {
  "github.copilot.chat.mcp.enabled": true,
  "mcpServers": vscodeConfig.servers
};

fs.writeFileSync(
  path.join(PROJECT_ROOT, 'vscode-settings-snippet.json'),
  JSON.stringify(settingsSnippet, null, 2)
);

console.log('\n📝 Configuration files generated!');
console.log('\nUsage:');
console.log('- VSCode: Config will be auto-detected from .vscode/mcp.json');
console.log('- Cursor: Copy .cursor/mcp.json to your project');
console.log('- Visual Studio: Copy mcp-global.json to %USERPROFILE%\\.mcp.json');
console.log('- User Settings: Add content from vscode-settings-snippet.json to settings.json');
console.log('\n💡 Tip: Run this script after adding new servers to regenerate configs');