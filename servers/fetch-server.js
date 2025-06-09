#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isDomainAllowed } from './config.js';

const server = new Server({
  name: 'fetch',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'fetch',
      description: 'Fetch content from a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
          method: { 
            type: 'string', 
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            default: 'GET'
          },
          headers: { 
            type: 'object',
            description: 'HTTP headers to send'
          },
          body: {
            type: 'string',
            description: 'Request body (for POST, PUT, PATCH)'
          }
        },
        required: ['url']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== 'fetch') {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  if (!isDomainAllowed(args.url)) {
    throw new Error(`Domain not allowed: ${args.url}`);
  }
  
  try {
    const options = {
      method: args.method || 'GET',
      headers: {
        'User-Agent': 'MCP-Fetch-Server/1.0',
        ...args.headers
      },
      timeout: 30000
    };
    
    if (args.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      options.body = args.body;
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(args.url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        }, null, 2)
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
console.error('Fetch MCP server running on stdio');