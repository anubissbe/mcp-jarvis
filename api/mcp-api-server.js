import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Server configurations
const MCP_SERVERS = {
  filesystem: { file: 'filesystem-server.js', description: 'File operations' },
  fetch: { file: 'fetch-server.js', description: 'HTTP requests' },
  memory: { file: 'memory-server.js', description: 'Persistent key-value storage' },
  git: { file: 'git-server.js', description: 'Git operations' },
  sqlite: { file: 'sqlite-server.js', description: 'SQLite database operations' },
  puppeteer: { file: 'puppeteer-server.js', description: 'Browser automation' },
  webSearch: { file: 'web-search-server.js', description: 'Web search' },
  docker: { file: 'docker-server.js', description: 'Docker container management' },
  systemMonitor: { file: 'system-monitor-server.js', description: 'System monitoring' },
  time: { file: 'time-server.js', description: 'Time and timezone operations' },
  nodeSandbox: { file: 'node-sandbox-server.js', description: 'JavaScript execution' },
  pythonSandbox: { file: 'python-sandbox-server.js', description: 'Python execution' },
  selfLearning: { file: 'self-learning-server.js', description: 'Documentation learning' },
  imageGeneration: { file: 'image-gen-server.js', description: 'AI image generation' },
  everything: { file: 'everything-server.js', description: 'Comprehensive test server' },
  sequentialThinking: { file: 'sequential-thinking-server.js', description: 'Structured problem-solving' },
  sequentialThinkingTools: { file: 'sequential-thinking-tools-server.js', description: 'Enhanced tool guidance' }
};

// Active server processes
const activeServers = new Map();
const serverSessions = new Map();

class MCPServerManager {
  constructor(serverName, serverConfig) {
    this.serverName = serverName;
    this.serverConfig = serverConfig;
    this.process = null;
    this.messageHandlers = new Map();
    this.messageId = 0;
  }

  async start() {
    const serverPath = path.join(PROJECT_ROOT, 'servers', this.serverConfig.file);
    
    this.process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    this.process.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          const message = JSON.parse(line);
          if (message.id && this.messageHandlers.has(message.id)) {
            const handler = this.messageHandlers.get(message.id);
            this.messageHandlers.delete(message.id);
            handler(message);
          }
        }
      } catch (error) {
        console.error(`Error parsing output from ${this.serverName}:`, error);
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error(`${this.serverName} error:`, data.toString());
    });

    this.process.on('error', (error) => {
      console.error(`Failed to start ${this.serverName}:`, error);
    });

    // Initialize the server with proper MCP initialization
    await this.sendRequest({ 
      method: 'initialize', 
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: "mcp-api-server",
          version: "1.0.0"
        }
      } 
    });
    
    return this;
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const fullRequest = { ...request, id, jsonrpc: '2.0' };
      
      this.messageHandlers.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.process.stdin.write(JSON.stringify(fullRequest) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.messageHandlers.has(id)) {
          this.messageHandlers.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

// API Endpoints

// List available servers
app.get('/api/servers', (req, res) => {
  const servers = Object.entries(MCP_SERVERS).map(([name, config]) => ({
    name,
    description: config.description,
    active: activeServers.has(name)
  }));
  res.json({ servers });
});

// Start a server
app.post('/api/servers/:name/start', async (req, res) => {
  const { name } = req.params;
  
  if (!MCP_SERVERS[name]) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  if (activeServers.has(name)) {
    return res.status(400).json({ error: 'Server already running' });
  }
  
  try {
    const manager = new MCPServerManager(name, MCP_SERVERS[name]);
    await manager.start();
    activeServers.set(name, manager);
    res.json({ message: `Server ${name} started successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop a server
app.post('/api/servers/:name/stop', async (req, res) => {
  const { name } = req.params;
  
  if (!activeServers.has(name)) {
    return res.status(400).json({ error: 'Server not running' });
  }
  
  const manager = activeServers.get(name);
  await manager.stop();
  activeServers.delete(name);
  
  res.json({ message: `Server ${name} stopped successfully` });
});

// List tools from a server
app.get('/api/servers/:name/tools', async (req, res) => {
  const { name } = req.params;
  
  if (!activeServers.has(name)) {
    return res.status(400).json({ error: 'Server not running' });
  }
  
  try {
    const manager = activeServers.get(name);
    const result = await manager.sendRequest({ method: 'tools/list', params: {} });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Call a tool
app.post('/api/servers/:name/tools/:tool', async (req, res) => {
  const { name, tool } = req.params;
  const { arguments: args } = req.body;
  
  if (!activeServers.has(name)) {
    return res.status(400).json({ error: 'Server not running' });
  }
  
  try {
    const manager = activeServers.get(name);
    const result = await manager.sendRequest({
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a session for interactive use
app.post('/api/sessions', (req, res) => {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    servers: new Map(),
    created: new Date()
  };
  
  serverSessions.set(sessionId, session);
  res.json({ sessionId });
});

// Execute commands in a session
app.post('/api/sessions/:sessionId/execute', async (req, res) => {
  const { sessionId } = req.params;
  const { server, tool, arguments: args } = req.body;
  
  if (!serverSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    // Ensure server is started
    if (!activeServers.has(server)) {
      const manager = new MCPServerManager(server, MCP_SERVERS[server]);
      await manager.start();
      activeServers.set(server, manager);
    }
    
    const manager = activeServers.get(server);
    const result = await manager.sendRequest({
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeServers: Array.from(activeServers.keys()),
    sessionCount: serverSessions.size
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    endpoints: {
      'GET /api/servers': 'List all available MCP servers',
      'POST /api/servers/:name/start': 'Start a specific MCP server',
      'POST /api/servers/:name/stop': 'Stop a specific MCP server',
      'GET /api/servers/:name/tools': 'List tools available in a server',
      'POST /api/servers/:name/tools/:tool': 'Execute a tool with arguments',
      'POST /api/sessions': 'Create a new session',
      'POST /api/sessions/:sessionId/execute': 'Execute commands in a session',
      'GET /health': 'Health check'
    },
    servers: Object.keys(MCP_SERVERS)
  });
});

// WebSocket support for real-time communication
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`MCP API Server running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const sessionId = uuidv4();
  console.log(`WebSocket client connected: ${sessionId}`);
  
  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message);
      
      switch (request.type) {
        case 'execute':
          const { server, tool, arguments: args } = request;
          
          if (!activeServers.has(server)) {
            const manager = new MCPServerManager(server, MCP_SERVERS[server]);
            await manager.start();
            activeServers.set(server, manager);
          }
          
          const manager = activeServers.get(server);
          const result = await manager.sendRequest({
            method: 'tools/call',
            params: { name: tool, arguments: args }
          });
          
          ws.send(JSON.stringify({ id: request.id, result }));
          break;
          
        case 'list-tools':
          const tools = {};
          for (const [name, manager] of activeServers.entries()) {
            const toolsList = await manager.sendRequest({ method: 'tools/list', params: {} });
            tools[name] = toolsList.tools;
          }
          ws.send(JSON.stringify({ id: request.id, tools }));
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${sessionId}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down MCP API Server...');
  
  for (const [name, manager] of activeServers.entries()) {
    await manager.stop();
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});