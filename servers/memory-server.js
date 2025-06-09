#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { MEMORY_STORE_PATH, MCP_DATA_DIR } from './config.js';

const MEMORY_FILE = MEMORY_STORE_PATH;
let memoryStore = {};

// Ensure data directory exists
await fs.mkdir(MCP_DATA_DIR, { recursive: true }).catch(() => {});

// Load existing memory
try {
  const data = await fs.readFile(MEMORY_FILE, 'utf-8');
  memoryStore = JSON.parse(data);
} catch (error) {
  // File doesn't exist yet, start with empty store
}

const server = new Server({
  name: 'memory',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Auto-save function
setInterval(async () => {
  try {
    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memoryStore, null, 2));
  } catch (error) {
    console.error('Failed to save memory:', error);
  }
}, 5000);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'memory_set',
      description: 'Store a value in memory',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key to store value under' },
          value: { description: 'Value to store (any type)' }
        },
        required: ['key', 'value']
      }
    },
    {
      name: 'memory_get',
      description: 'Retrieve a value from memory',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key to retrieve value for' }
        },
        required: ['key']
      }
    },
    {
      name: 'memory_delete',
      description: 'Delete a value from memory',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key to delete' }
        },
        required: ['key']
      }
    },
    {
      name: 'memory_list',
      description: 'List all keys in memory',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'memory_clear',
      description: 'Clear all memory',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'memory_set':
        memoryStore[args.key] = args.value;
        result = `Stored value for key: ${args.key}`;
        break;
        
      case 'memory_get':
        if (args.key in memoryStore) {
          result = JSON.stringify(memoryStore[args.key]);
        } else {
          result = `Key not found: ${args.key}`;
        }
        break;
        
      case 'memory_delete':
        if (args.key in memoryStore) {
          delete memoryStore[args.key];
          result = `Deleted key: ${args.key}`;
        } else {
          result = `Key not found: ${args.key}`;
        }
        break;
        
      case 'memory_list':
        result = `Keys in memory: ${Object.keys(memoryStore).join(', ')}`;
        break;
        
      case 'memory_clear':
        memoryStore = {};
        result = 'Memory cleared';
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: result
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Memory MCP server running on stdio');