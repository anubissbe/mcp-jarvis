#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the Node Code Sandbox MCP server
const serverProcess = spawn('node', [
  join(dirname(require.resolve('node-code-sandbox-mcp')), 'dist', 'index.js')
], {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start Node Sandbox server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  process.exit(code || 0);
});