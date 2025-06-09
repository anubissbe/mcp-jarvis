#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isPathAllowed } from './config.js';

const execAsync = promisify(exec);

const server = new Server({
  name: 'git',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Use the same path checking as filesystem operations
const isRepoAllowed = isPathAllowed;

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'git_status',
      description: 'Get git status of a repository',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository path' }
        },
        required: ['repo']
      }
    },
    {
      name: 'git_log',
      description: 'Get git commit log',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository path' },
          limit: { type: 'number', default: 10 }
        },
        required: ['repo']
      }
    },
    {
      name: 'git_diff',
      description: 'Get git diff',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository path' },
          staged: { type: 'boolean', default: false }
        },
        required: ['repo']
      }
    },
    {
      name: 'git_branch',
      description: 'List or create git branches',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository path' },
          create: { type: 'string', description: 'Branch name to create' }
        },
        required: ['repo']
      }
    },
    {
      name: 'git_init',
      description: 'Initialize a new git repository',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository path' }
        },
        required: ['repo']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!isRepoAllowed(args.repo)) {
    throw new Error(`Access denied: ${args.repo} is outside allowed paths`);
  }
  
  try {
    let command;
    const options = { cwd: args.repo };
    
    switch (name) {
      case 'git_status':
        command = 'git status --porcelain';
        break;
        
      case 'git_log':
        command = `git log --oneline -${args.limit || 10}`;
        break;
        
      case 'git_diff':
        command = args.staged ? 'git diff --staged' : 'git diff';
        break;
        
      case 'git_branch':
        command = args.create ? `git branch ${args.create}` : 'git branch -a';
        break;
        
      case 'git_init':
        command = 'git init';
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    const { stdout, stderr } = await execAsync(command, options);
    
    return {
      content: [{
        type: 'text',
        text: stdout || stderr || 'Command executed successfully'
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
console.error('Git MCP server running on stdio');