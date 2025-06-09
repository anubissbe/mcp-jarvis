#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { isPathAllowed, ALLOWED_PATHS } from './config.js';

// Create MCP server instance
const server = new McpServer({
  name: 'filesystem-server',
  version: '1.0.0',
});

// Add filesystem tools using the new SDK API
server.tool(
  'read_file',
  {
    path: z.string().describe('File path to read'),
  },
  async ({ path: filePath }) => {
    if (!isPathAllowed(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Path must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading file: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'write_file',
  {
    path: z.string().describe('File path to write'),
    content: z.string().describe('Content to write to the file'),
  },
  async ({ path: filePath, content }) => {
    if (!isPathAllowed(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Path must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote to ${filePath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error writing file: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'list_directory',
  {
    path: z.string().describe('Directory path to list'),
  },
  async ({ path: dirPath }) => {
    if (!isPathAllowed(dirPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Path must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = entries
        .map(entry => `${entry.isDirectory() ? '[DIR]' : '[FILE]'} ${entry.name}`)
        .join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: files || 'Directory is empty',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing directory: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'create_directory',
  {
    path: z.string().describe('Directory path to create'),
  },
  async ({ path: dirPath }) => {
    if (!isPathAllowed(dirPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Path must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      await fs.mkdir(dirPath, { recursive: true });
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created directory ${dirPath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating directory: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'delete_file',
  {
    path: z.string().describe('File path to delete'),
  },
  async ({ path: filePath }) => {
    if (!isPathAllowed(filePath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Path must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      await fs.unlink(filePath);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted ${filePath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting file: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'move_file',
  {
    source: z.string().describe('Source file path'),
    destination: z.string().describe('Destination file path'),
  },
  async ({ source, destination }) => {
    if (!isPathAllowed(source) || !isPathAllowed(destination)) {
      return {
        content: [
          {
            type: 'text',
            text: `Access denied. Paths must be within allowed directories: ${ALLOWED_PATHS.join(', ')}`,
          },
        ],
      };
    }

    try {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(source, destination);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully moved ${source} to ${destination}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error moving file: ${error.message}`,
          },
        ],
      };
    }
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Filesystem MCP server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(console.error);
}