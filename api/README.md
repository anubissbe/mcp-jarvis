# MCP Jarvis API Server

A unified REST and WebSocket API that manages all MCP servers in a single container.

## 🚀 Quick Start

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Docker Build
```bash
docker build -t mcp-jarvis .
docker run -p 3000:3000 mcp-jarvis
```

### Local Development
```bash
cd api
node mcp-api-server.js
```

## 📡 API Endpoints

### Server Management

#### List Available Servers
```http
GET /api/servers
```
**Response:**
```json
{
  "servers": [
    {
      "name": "filesystem",
      "description": "File operations",
      "active": false
    }
  ]
}
```

#### Start Server
```http
POST /api/servers/{name}/start
```
**Response:**
```json
{
  "message": "Server filesystem started successfully"
}
```

#### Stop Server
```http
POST /api/servers/{name}/stop
```

#### List Server Tools
```http
GET /api/servers/{name}/tools
```
**Response:**
```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read the contents of a file",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "The file path to read"
          }
        }
      }
    }
  ]
}
```

#### Execute Tool
```http
POST /api/servers/{name}/tools/{tool}
```
**Request Body:**
```json
{
  "arguments": {
    "path": "/app/data/test.txt"
  }
}
```

### Session Management

#### Create Session
```http
POST /api/sessions
```
**Response:**
```json
{
  "sessionId": "uuid-session-id"
}
```

#### Execute in Session
```http
POST /api/sessions/{sessionId}/execute
```
**Request Body:**
```json
{
  "server": "filesystem",
  "tool": "read_file",
  "arguments": {
    "path": "/app/data/test.txt"
  }
}
```

### Health & Info

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "activeServers": ["filesystem", "fetch"],
  "sessionCount": 3
}
```

#### API Documentation
```http
GET /api
```

## 🔌 WebSocket API

Connect to `ws://localhost:3000` for real-time communication.

### Execute Tool
```json
{
  "type": "execute",
  "id": "request-id",
  "server": "filesystem", 
  "tool": "read_file",
  "arguments": {
    "path": "/app/data/test.txt"
  }
}
```

### List Tools
```json
{
  "type": "list-tools",
  "id": "request-id"
}
```

**Response:**
```json
{
  "id": "request-id",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "File contents here"
      }
    ]
  }
}
```

## 🏗️ Available MCP Servers

| Server | Description | Key Tools |
|--------|-------------|-----------|
| `filesystem` | File operations | read_file, write_file, list_directory |
| `fetch` | HTTP requests | fetch, download |
| `memory` | Key-value storage | store, retrieve, list |
| `git` | Git operations | status, log, diff |
| `sqlite` | Database ops | query, execute |
| `puppeteer` | Browser automation | navigate, screenshot, click |
| `webSearch` | Web search | search |
| `docker` | Container management | list_containers, run |
| `systemMonitor` | System metrics | cpu_usage, memory_info |
| `selfLearning` | Doc learning | learn_topic, search_knowledge |

## 🔧 Configuration

### Environment Variables
```bash
# Server settings
PORT=3000
NODE_ENV=production

# Security (comma-separated)
ALLOWED_PATHS=/app/data,/tmp
ALLOWED_DOMAINS=github.com,npmjs.com

# Optional services
IMAGE_GEN_API_URL=http://localhost:8000
DENO_PATH=/root/.deno/bin/deno
```

### Docker Environment
The container includes:
- Node.js 18
- Python 3 + pip
- Chromium (for Puppeteer)
- Deno (for Python sandbox)
- Git

## 🔒 Security Features

- **Sandboxed Execution**: All code runs in containers
- **Path Restrictions**: File access limited to allowed paths
- **Domain Whitelisting**: HTTP requests restricted to safe domains
- **Resource Limits**: Memory and CPU controls
- **No Privilege Escalation**: Runs as non-root user

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### List Servers
```bash
curl http://localhost:3000/api/servers
```

### Start Filesystem Server
```bash
curl -X POST http://localhost:3000/api/servers/filesystem/start
```

### Execute Tool
```bash
curl -X POST http://localhost:3000/api/servers/filesystem/tools/list_directory \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"path": "/app/data"}}'
```

## 🔄 Integration Examples

### Python Client
```python
import requests
import websocket
import json

# REST API
response = requests.get('http://localhost:3000/api/servers')
servers = response.json()['servers']

# Execute tool
result = requests.post(
    'http://localhost:3000/api/servers/filesystem/tools/read_file',
    json={'arguments': {'path': '/app/data/test.txt'}}
)

# WebSocket
def on_message(ws, message):
    print(json.loads(message))

ws = websocket.WebSocketApp("ws://localhost:3000")
ws.on_message = on_message
ws.run_forever()
```

### JavaScript Client
```javascript
// REST API
const response = await fetch('http://localhost:3000/api/servers');
const { servers } = await response.json();

// Execute tool
const result = await fetch(
  'http://localhost:3000/api/servers/filesystem/tools/read_file',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      arguments: { path: '/app/data/test.txt' }
    })
  }
);

// WebSocket
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

### curl Examples
```bash
# List all available servers
curl http://localhost:3000/api/servers | jq

# Start the filesystem server
curl -X POST http://localhost:3000/api/servers/filesystem/start

# Read a file
curl -X POST http://localhost:3000/api/servers/filesystem/tools/read_file \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"path": "/app/data/config.json"}}'

# Search the web
curl -X POST http://localhost:3000/api/servers/webSearch/start
curl -X POST http://localhost:3000/api/servers/webSearch/tools/search \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "MCP Model Context Protocol"}}'

# Take a screenshot
curl -X POST http://localhost:3000/api/servers/puppeteer/start
curl -X POST http://localhost:3000/api/servers/puppeteer/tools/screenshot \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"url": "https://github.com", "path": "/app/data/github.png"}}'
```

## 🐳 Production Deployment

### Docker Compose Production
```yaml
version: '3.8'
services:
  mcp-jarvis:
    image: your-registry/mcp-jarvis:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ALLOWED_PATHS=/app/data,/app/workspace
    volumes:
      - mcp-data:/app/data
      - ./workspace:/app/workspace:ro
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-jarvis
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-jarvis
  template:
    spec:
      containers:
      - name: mcp-jarvis
        image: your-registry/mcp-jarvis:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-jarvis-service
spec:
  selector:
    app: mcp-jarvis
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 📊 Monitoring

### Metrics Endpoints
- `GET /health` - Health status
- `GET /api/servers` - Server status
- WebSocket connection count available in health endpoint

### Logging
- Container logs: `docker logs mcp-jarvis-api`
- Application logs: `/app/logs/` directory
- Server-specific logs for debugging

## 🔧 Troubleshooting

### Common Issues

1. **Server won't start**
   ```bash
   docker logs mcp-jarvis-api
   curl http://localhost:3000/health
   ```

2. **Tool execution fails**
   - Check allowed paths in environment
   - Verify server is started
   - Check tool arguments format

3. **Permission errors**
   - Ensure volumes are properly mounted
   - Check container user permissions

4. **Memory issues**
   - Increase Docker memory limits
   - Monitor resource usage

### Debug Mode
```bash
# Enable debug logging
docker run -e NODE_ENV=development -p 3000:3000 mcp-jarvis
```