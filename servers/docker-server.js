#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const server = new Server({
  name: 'docker',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'docker_ps',
      description: 'List Docker containers',
      inputSchema: {
        type: 'object',
        properties: {
          all: { type: 'boolean', default: false }
        }
      }
    },
    {
      name: 'docker_images',
      description: 'List Docker images',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'docker_run',
      description: 'Run a Docker container',
      inputSchema: {
        type: 'object',
        properties: {
          image: { type: 'string' },
          name: { type: 'string' },
          ports: { type: 'array', items: { type: 'string' } },
          volumes: { type: 'array', items: { type: 'string' } },
          env: { type: 'object' },
          detach: { type: 'boolean', default: true }
        },
        required: ['image']
      }
    },
    {
      name: 'docker_exec',
      description: 'Execute command in running container',
      inputSchema: {
        type: 'object',
        properties: {
          container: { type: 'string' },
          command: { type: 'string' }
        },
        required: ['container', 'command']
      }
    },
    {
      name: 'docker_stop',
      description: 'Stop Docker containers',
      inputSchema: {
        type: 'object',
        properties: {
          container: { type: 'string' }
        },
        required: ['container']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let command;
    
    switch (name) {
      case 'docker_ps':
        command = `docker ps ${args.all ? '-a' : ''} --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"`;
        break;
        
      case 'docker_images':
        command = 'docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"';
        break;
        
      case 'docker_run':
        const flags = [];
        if (args.detach) flags.push('-d');
        if (args.name) flags.push(`--name ${args.name}`);
        if (args.ports) args.ports.forEach(p => flags.push(`-p ${p}`));
        if (args.volumes) args.volumes.forEach(v => flags.push(`-v ${v}`));
        if (args.env) Object.entries(args.env).forEach(([k, v]) => flags.push(`-e ${k}=${v}`));
        
        command = `docker run ${flags.join(' ')} ${args.image}`;
        break;
        
      case 'docker_exec':
        command = `docker exec ${args.container} ${args.command}`;
        break;
        
      case 'docker_stop':
        command = `docker stop ${args.container}`;
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    const { stdout, stderr } = await execAsync(command);
    
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
console.error('Docker MCP server running on stdio');