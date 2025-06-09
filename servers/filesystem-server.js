#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';

const server = new Server({
  name: 'filesystem',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

const allowedPaths = ['/home', '/opt', '/tmp', '/var/log'];

function isPathAllowed(filePath) {
  const normalizedPath = path.resolve(filePath);
  return allowedPaths.some(allowed => normalizedPath.startsWith(path.resolve(allowed)));
}

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'read_file',
      description: 'Read a file from the filesystem',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' }
        },
        required: ['path']
      }
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'list_directory',
      description: 'List contents of a directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' }
        },
        required: ['path']
      }
    },
    {
      name: 'create_directory',
      description: 'Create a directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to create' }
        },
        required: ['path']
      }
    },
    {
      name: 'delete_file',
      description: 'Delete a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to delete' }
        },
        required: ['path']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!isPathAllowed(args.path)) {
    throw new Error(`Access denied: ${args.path} is outside allowed paths`);
  }
  
  try {
    let result;
    
    switch (name) {
      case 'read_file':
        result = await fs.readFile(args.path, 'utf-8');
        break;
        
      case 'write_file':
        await fs.writeFile(args.path, args.content, 'utf-8');
        result = `File written successfully: ${args.path}`;
        break;
        
      case 'list_directory':
        const files = await fs.readdir(args.path);
        result = files.join('\n');
        break;
        
      case 'create_directory':
        await fs.mkdir(args.path, { recursive: true });
        result = `Directory created: ${args.path}`;
        break;
        
      case 'delete_file':
        await fs.unlink(args.path);
        result = `File deleted: ${args.path}`;
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
console.error('Filesystem MCP server running on stdio');