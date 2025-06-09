#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const server = new Server({
  name: 'system-monitor',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'cpu_info',
      description: 'Get CPU information and usage',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'memory_info',
      description: 'Get memory usage information',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'disk_usage',
      description: 'Get disk usage information',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', default: '/' }
        }
      }
    },
    {
      name: 'network_info',
      description: 'Get network interface information',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'process_list',
      description: 'Get running processes',
      inputSchema: {
        type: 'object',
        properties: {
          sortBy: { 
            type: 'string', 
            enum: ['cpu', 'memory', 'pid'],
            default: 'cpu'
          },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  ]
}));

server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'system://metrics',
      name: 'System Metrics',
      description: 'Real-time system metrics',
      mimeType: 'application/json'
    }
  ]
}));

server.setRequestHandler('resources/read', async (request) => {
  if (request.params.uri === 'system://metrics') {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      contents: [{
        uri: 'system://metrics',
        mimeType: 'application/json',
        text: JSON.stringify({
          timestamp: new Date().toISOString(),
          cpu: {
            cores: cpus.length,
            model: cpus[0].model,
            loadAverage: os.loadavg()
          },
          memory: {
            total: totalMem,
            free: freeMem,
            used: totalMem - freeMem,
            percentage: ((totalMem - freeMem) / totalMem * 100).toFixed(2)
          },
          uptime: os.uptime(),
          platform: os.platform(),
          hostname: os.hostname()
        }, null, 2)
      }]
    };
  }
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'cpu_info':
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        result = `CPU Information:
- Model: ${cpus[0].model}
- Cores: ${cpus.length}
- Load Average: ${loadAvg.map(l => l.toFixed(2)).join(', ')}
- Architecture: ${os.arch()}`;
        break;
        
      case 'memory_info':
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        result = `Memory Usage:
- Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
- Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${(usedMem / totalMem * 100).toFixed(1)}%)
- Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB (${(freeMem / totalMem * 100).toFixed(1)}%)`;
        break;
        
      case 'disk_usage':
        const { stdout } = await execAsync(`df -h ${args.path} | tail -1`);
        const parts = stdout.trim().split(/\s+/);
        result = `Disk Usage for ${args.path}:
- Total: ${parts[1]}
- Used: ${parts[2]} (${parts[4]})
- Available: ${parts[3]}
- Filesystem: ${parts[0]}`;
        break;
        
      case 'network_info':
        const interfaces = os.networkInterfaces();
        result = 'Network Interfaces:\n';
        Object.entries(interfaces).forEach(([name, addrs]) => {
          result += `\n${name}:\n`;
          addrs.forEach(addr => {
            if (addr.family === 'IPv4') {
              result += `  - IPv4: ${addr.address}\n`;
            }
          });
        });
        break;
        
      case 'process_list':
        const sortFlag = args.sortBy === 'cpu' ? '-pcpu' : 
                        args.sortBy === 'memory' ? '-pmem' : '-pid';
        const { stdout: psOut } = await execAsync(
          `ps aux --sort=${sortFlag} | head -${args.limit + 1}`
        );
        result = `Top ${args.limit} processes by ${args.sortBy}:\n\n${psOut}`;
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
console.error('System Monitor MCP server running on stdio');