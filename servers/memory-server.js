#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
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

// Auto-save function
async function saveMemory() {
  try {
    await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
    await fs.writeFile(MEMORY_FILE, JSON.stringify(memoryStore, null, 2));
  } catch (error) {
    console.error('Failed to save memory:', error);
  }
}

// Create MCP server instance
const server = new McpServer({
  name: 'memory-server',
  version: '1.0.0',
});

// Auto-save every 5 seconds
setInterval(saveMemory, 5000);

// Add memory tools using the new SDK API
server.tool(
  'memory_set',
  {
    key: z.string().describe('Key to store value under'),
    value: z.any().describe('Value to store (any type)'),
  },
  async ({ key, value }) => {
    memoryStore[key] = value;
    await saveMemory();
    return {
      content: [
        {
          type: 'text',
          text: `Stored value for key: ${key}`,
        },
      ],
    };
  }
);

server.tool(
  'memory_get',
  {
    key: z.string().describe('Key to retrieve value for'),
  },
  async ({ key }) => {
    if (key in memoryStore) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(memoryStore[key]),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Key not found: ${key}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'memory_delete',
  {
    key: z.string().describe('Key to delete'),
  },
  async ({ key }) => {
    if (key in memoryStore) {
      delete memoryStore[key];
      await saveMemory();
      return {
        content: [
          {
            type: 'text',
            text: `Deleted key: ${key}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Key not found: ${key}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'memory_list',
  {},
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: `Keys in memory: ${Object.keys(memoryStore).join(', ')}`,
        },
      ],
    };
  }
);

server.tool(
  'memory_clear',
  {},
  async () => {
    memoryStore = {};
    await saveMemory();
    return {
      content: [
        {
          type: 'text',
          text: 'Memory cleared',
        },
      ],
    };
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memory MCP server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(console.error);
}