#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const server = new Server({
  name: 'sqlite',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

const databases = {
  main: '/opt/MCP/data/main.db',
  analytics: '/opt/MCP/data/analytics.db',
  logs: '/opt/MCP/data/logs.db'
};

// Ensure data directory exists
await fs.mkdir('/opt/MCP/data', { recursive: true });

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'sqlite_query',
      description: 'Execute SQL query on a database',
      inputSchema: {
        type: 'object',
        properties: {
          database: { 
            type: 'string', 
            enum: Object.keys(databases),
            description: 'Database to query'
          },
          query: { type: 'string', description: 'SQL query to execute' },
          params: { 
            type: 'array', 
            description: 'Query parameters',
            items: {}
          }
        },
        required: ['database', 'query']
      }
    },
    {
      name: 'sqlite_schema',
      description: 'Get database schema information',
      inputSchema: {
        type: 'object',
        properties: {
          database: { 
            type: 'string', 
            enum: Object.keys(databases)
          }
        },
        required: ['database']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    if (!databases[args.database]) {
      throw new Error(`Unknown database: ${args.database}`);
    }
    
    const dbPath = databases[args.database];
    const db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    const runAsync = promisify(db.run.bind(db));
    const allAsync = promisify(db.all.bind(db));
    const closeAsync = promisify(db.close.bind(db));
    
    let result;
    
    try {
      switch (name) {
        case 'sqlite_query':
          const query = args.query.trim().toUpperCase();
          
          if (query.startsWith('SELECT') || query.startsWith('PRAGMA')) {
            result = await allAsync(args.query, args.params || []);
            result = JSON.stringify(result, null, 2);
          } else {
            const runResult = await runAsync(args.query, args.params || []);
            result = `Query executed. Rows affected: ${runResult.changes}`;
          }
          break;
          
        case 'sqlite_schema':
          const tables = await allAsync(
            "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name"
          );
          result = 'Database Schema:\n\n';
          for (const table of tables) {
            result += `Table: ${table.name}\n${table.sql}\n\n`;
          }
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } finally {
      await closeAsync();
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
console.error('SQLite MCP server running on stdio');