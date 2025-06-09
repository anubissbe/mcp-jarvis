#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing MCP Servers...\n');

const servers = [
  { name: 'filesystem', script: 'filesystem-server.js' },
  { name: 'fetch', script: 'fetch-server.js' },
  { name: 'memory', script: 'memory-server.js' },
  { name: 'git', script: 'git-server.js' },
  { name: 'sqlite', script: 'sqlite-server.js' },
  { name: 'puppeteer', script: 'puppeteer-server.js' }
];

async function testServer(server) {
  return new Promise((resolve) => {
    console.log(`Testing ${server.name} server...`);
    
    const serverPath = path.join('/opt/MCP/servers', server.script);
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    // Send a basic MCP handshake
    const handshake = JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '1.0',
        capabilities: {}
      },
      id: 1
    }) + '\n';
    
    child.stdin.write(handshake);
    
    setTimeout(() => {
      child.kill();
      
      if (error && !error.includes('Expected')) {
        console.log(`❌ ${server.name}: Failed with error`);
        console.log(`   ${error.split('\n')[0]}`);
      } else if (output || error.includes('Expected')) {
        console.log(`✅ ${server.name}: Server started successfully`);
      } else {
        console.log(`⚠️  ${server.name}: No response (may need dependencies)`);
      }
      
      resolve();
    }, 2000);
    
    child.on('error', (err) => {
      console.log(`❌ ${server.name}: ${err.message}`);
      resolve();
    });
  });
}

async function runTests() {
  for (const server of servers) {
    await testServer(server);
  }
  
  console.log('\n✨ Testing complete!');
  console.log('\nNote: Some servers may require additional setup or dependencies.');
  console.log('Run "npm install" in /opt/MCP if you haven\'t already.');
}

runTests();