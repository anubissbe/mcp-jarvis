#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { DENO_PATH } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the Python Sandbox MCP server using Deno
const serverProcess = spawn(DENO_PATH, [
  'run',
  '--allow-all',
  'jsr:@pydantic/mcp-run-python'
], {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start Python Sandbox server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  process.exit(code || 0);
});