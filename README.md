# MCP Jarvis - Enhanced AI Assistant Capabilities

[![CI](https://github.com/anubissbe/mcp-jarvis/actions/workflows/ci.yml/badge.svg)](https://github.com/anubissbe/mcp-jarvis/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

A comprehensive collection of Model Context Protocol (MCP) servers that extend AI assistants (Claude, GitHub Copilot, Cursor) with filesystem access, web requests, database operations, browser automation, and more.

## 🚀 Features

### Core MCP Servers
- **Filesystem Server** - File operations (read, write, create, delete, list directories)
- **Fetch Server** - HTTP requests to whitelisted domains
- **Memory Server** - Persistent key-value storage with auto-save
- **Git Server** - Version control operations
- **SQLite Server** - Database operations with 3 pre-configured databases
- **Puppeteer Server** - Browser automation and web scraping

### Additional Servers
- **Web Search Server** - Multi-engine web search capabilities
- **Docker Server** - Container management operations
- **System Monitor Server** - System metrics and monitoring
- **Playwright Server** - Alternative browser automation (via npx)
- **Everything Server** - Comprehensive test/demo server
- **Sequential Thinking Server** - Structured problem-solving
- **Sequential Thinking Tools** - Enhanced tool guidance
- **Time Server** - Time and timezone operations
- **Node Sandbox Server** - Secure JavaScript execution
- **Python Sandbox Server** - Secure Python execution
- **Image Generation Server** - AI image creation (Stable Diffusion)
- **Calculator Server** - Advanced mathematical operations
- **Markmap Server** - Markdown to mind map conversion
- **Self-Learning Server** - Documentation learning and knowledge management

## 📁 Project Structure

```
/opt/MCP/
├── package.json              # Node.js dependencies
├── config/
│   └── mcp-config.json      # Claude MCP configuration
├── servers/                 # MCP server implementations
│   ├── filesystem-server.js
│   ├── fetch-server.js
│   ├── memory-server.js
│   ├── git-server.js
│   ├── sqlite-server.js
│   ├── puppeteer-server.js
│   ├── web-search-server.js
│   ├── docker-server.js
│   └── system-monitor-server.js
├── scripts/                 # Setup and utility scripts
│   ├── install-all.js      # Install dependencies and initialize
│   ├── setup.js            # Configure Claude integration
│   └── test-servers.js     # Test server functionality
└── data/                   # Runtime data directory
    ├── main.db            # SQLite databases
    ├── analytics.db
    ├── logs.db
    └── memory-store.json  # Persistent memory storage
```

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- Git
- AI Assistant (one or more):
  - Claude Desktop App
  - VSCode with GitHub Copilot
  - Visual Studio with Copilot
  - Cursor IDE
  - Other MCP-compatible tools
- (Optional) Docker - for enhanced code sandbox features
- (Optional) Deno - for Python code execution

### Quick Setup for Claude

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anubissbe/mcp-jarvis.git
   cd mcp-jarvis
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env to customize your settings (optional)
   ```

3. **Install and setup:**
   ```bash
   npm install
   node scripts/setup.js
   node scripts/install-all.js
   ```

4. **Restart Claude Desktop App** to load the new servers

### Quick Setup for VSCode/GitHub Copilot

1. **Clone to your project or globally:**
   ```bash
   # Option A: In your project
   cd your-project
   git clone https://github.com/anubissbe/mcp-jarvis.git .mcp-servers
   
   # Option B: Global installation
   git clone https://github.com/anubissbe/mcp-jarvis.git ~/mcp-jarvis
   ```

2. **Install dependencies:**
   ```bash
   cd mcp-jarvis  # or .mcp-servers
   npm install
   ```

3. **VSCode will automatically detect `.vscode/mcp.json`** or add to settings:
   ```json
   {
     "github.copilot.chat.mcp.enabled": true
   }
   ```

4. **Use in Copilot Chat:**
   - Open Copilot Chat (Ctrl+I)
   - Switch to "Agent" mode
   - Select tools with the Tools button
   - Use commands like: "Read the config file" or "Search for TODO comments"

### Setup for Other IDEs

#### Visual Studio (Windows)
- MCP config detected in: `%USERPROFILE%\.mcp.json` or `<solution>\.vs\mcp.json`
- Requires VS 2022 17.14+

#### Cursor IDE
- Place config in `.cursor/mcp.json` in your project
- Works similar to VSCode setup

### Configuration

The setup process will:
- Auto-detect your Claude configuration directory
- Create necessary data directories
- Initialize SQLite databases
- Configure all MCP servers

You can customize behavior by editing `.env`:
- Set allowed file paths and domains
- Configure external services (like image generation)
- Adjust resource limits

### Cross-Platform Support

#### 🐧 Linux
- Config location: `~/.config/claude/`
- Full native support
- All features available

#### 🍎 macOS  
- Config location: `~/Library/Application Support/Claude/`
- Full native support
- All features available

#### 🪟 Windows (Native)
- Config location: `%APPDATA%\Claude\`
- Full support via Node.js for Windows
- Install prerequisites:
  ```powershell
  # Install Node.js from https://nodejs.org
  # Or via winget:
  winget install OpenJS.NodeJS
  
  # Optional: Install Deno for Python sandbox
  irm https://deno.land/install.ps1 | iex
  ```

#### 🐧🪟 Windows WSL (Recommended for Developers)
- **Best of both worlds**: Run MCP servers in Linux, Claude on Windows
- **Automatic path translation**: WSL paths converted to Windows paths
- **How it works**:
  1. Install MCP Jarvis in WSL
  2. Setup script detects WSL and configures for Windows Claude
  3. Claude.exe communicates with WSL via `wsl.exe` wrapper

**WSL Setup:**
```bash
# In WSL terminal
git clone https://github.com/yourusername/mcp-jarvis.git
cd mcp-jarvis
npm install
node scripts/setup.js  # Auto-detects WSL and configures accordingly
```

**Important WSL Notes:**
- Claude Desktop must run on Windows (not in WSL)
- File paths are automatically translated between WSL and Windows
- All servers run in WSL but are accessible from Windows Claude

### Docker-Free Installation

All core features work without Docker. Only the advanced code sandbox features require Docker.

## 🐳 Docker Deployment

Run all MCP servers in a single container with unified API access.

### Quick Start
```bash
# Clone and setup
git clone https://github.com/anubissbe/mcp-jarvis.git
cd mcp-jarvis

# Start with Docker Compose
docker-compose up -d

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/servers
```

### API Access
- **REST API**: `http://localhost:3000/api/*`
- **WebSocket**: `ws://localhost:3000`
- **Health Check**: `http://localhost:3000/health`
- **Documentation**: `http://localhost:3000/api`

See `/api/README.md` for complete API documentation.

### Filesystem Access Configuration

**⚠️ Important**: By default, the Docker container only has access to its internal filesystem (`/app/data`, `/tmp`). To access your host filesystem, you need to configure volume mounts.

#### Linux/macOS Configuration

Edit `docker-compose.yml` to mount host directories:

```yaml
services:
  mcp-jarvis:
    volumes:
      # Default container volumes
      - mcp-data:/app/data
      - mcp-logs:/app/logs
      
      # Host filesystem access (choose what you need)
      - ~/projects:/app/projects          # Your development projects
      - ~/Documents:/app/documents:ro     # Documents (read-only)
      - ~/Downloads:/app/downloads        # Downloads folder
      - /var/log:/app/host-logs:ro        # System logs (read-only)
      
      # Advanced: Full home directory access
      - ~/:/app/home                      # Full home directory
      
      # Advanced: System-wide access (less secure)
      - /:/app/host:ro                    # Entire filesystem (read-only)
```

#### Windows Configuration

```yaml
services:
  mcp-jarvis:
    volumes:
      # Default container volumes
      - mcp-data:/app/data
      - mcp-logs:/app/logs
      
      # Windows host filesystem access
      - C:\Users\%USERNAME%\Documents:/app/documents
      - C:\Users\%USERNAME%\Projects:/app/projects
      - C:\temp:/app/temp
      
      # Full user directory
      - C:\Users\%USERNAME%:/app/home
```

#### WSL Configuration

```yaml
services:
  mcp-jarvis:
    volumes:
      # WSL filesystem
      - ~/:/app/home
      - /mnt/c/Users:/app/windows-users:ro
      
      # Specific directories
      - /mnt/c/projects:/app/projects
      - /mnt/c/temp:/app/temp
```

#### Environment Variable Configuration

Update the `ALLOWED_PATHS` environment variable to match your mounted volumes:

```yaml
environment:
  # Match your volume mounts
  - ALLOWED_PATHS=/app/data,/app/projects,/app/documents,/app/home
```

#### Security Levels

**🔒 Secure (Recommended)**
```yaml
volumes:
  - ~/projects:/app/projects           # Only specific directories
  - ~/Documents:/app/documents:ro      # Read-only where possible
environment:
  - ALLOWED_PATHS=/app/data,/app/projects,/app/documents
```

**🔓 Developer Mode**
```yaml
volumes:
  - ~/:/app/home                       # Full home directory
environment:
  - ALLOWED_PATHS=/app/home,/app/data,/tmp
```

**⚠️ Full Access (Use with caution)**
```yaml
volumes:
  - /:/app/host                        # Entire filesystem
environment:
  - ALLOWED_PATHS=/app/host,/app/data
```

### MCP Server Configuration Requirements

Different MCP servers have different filesystem and configuration needs:

#### Filesystem-Dependent Servers
- **filesystem-server**: Requires `ALLOWED_PATHS` configuration
- **git-server**: Needs access to git repositories
- **sqlite-server**: Requires database file locations
- **memory-server**: Needs persistent storage location
- **puppeteer-server**: Requires screenshot/download directories

#### Network-Dependent Servers  
- **fetch-server**: Requires `ALLOWED_DOMAINS` configuration
- **web-search-server**: Needs internet access
- **self-learning-server**: Requires both network and filesystem access

#### External Service Servers
- **image-generation-server**: Requires `IMAGE_GEN_API_URL` configuration
- **docker-server**: Needs Docker socket access (see below)

#### System-Dependent Servers
- **system-monitor-server**: Requires host system access
- **python-sandbox-server**: Needs Deno installation

### Docker Socket Access (for docker-server)

To use the Docker server from within the container:

```yaml
services:
  mcp-jarvis:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
```

### Complete Configuration Examples

**See `docker-compose.examples.yml` for complete platform-specific configurations.**

**Quick Linux Example:**

```yaml
version: '3.8'
services:
  mcp-jarvis:
    build: .
    ports:
      - "3000:3000"
    environment:
      # Core settings
      - NODE_ENV=production
      - PORT=3000
      
      # Filesystem access
      - ALLOWED_PATHS=/app/data,/app/home,/app/projects,/tmp
      
      # Network access
      - ALLOWED_DOMAINS=github.com,npmjs.com,pypi.org,docs.python.org,nodejs.org
      
      # External services
      - IMAGE_GEN_API_URL=http://host.docker.internal:8000
      - DOCKER_HOST=unix:///var/run/docker.sock
      
    volumes:
      # Persistent data
      - mcp-data:/app/data
      - mcp-logs:/app/logs
      
      # Host filesystem access
      - ~/:/app/home
      - ~/projects:/app/projects
      - /tmp:/app/tmp
      
      # Docker access
      - /var/run/docker.sock:/var/run/docker.sock
      
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mcp-data:
  mcp-logs:
```

### Testing Filesystem Access

After configuration, test filesystem access:

```bash
# Start a filesystem server
curl -X POST http://localhost:3000/api/servers/filesystem/start

# List your home directory
curl -X POST http://localhost:3000/api/servers/filesystem/tools/list_directory \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"path": "/app/home"}}'

# Read a file
curl -X POST http://localhost:3000/api/servers/filesystem/tools/read_file \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"path": "/app/home/.bashrc"}}'
```

## 🔧 Configuration

The MCP servers are configured in `config/mcp-config.json`. Each server can be enabled/disabled by adding or removing it from the configuration.

### MCP Server Configuration Matrix

| Server | Filesystem Access | Network Access | External Dependencies | Special Config |
|--------|-------------------|----------------|----------------------|----------------|
| **filesystem** | ✅ Required | ❌ No | ❌ None | `ALLOWED_PATHS` |
| **fetch** | ❌ No | ✅ Required | ❌ None | `ALLOWED_DOMAINS` |
| **memory** | ✅ Optional | ❌ No | ❌ None | Persistent storage |
| **git** | ✅ Required | ❌ No | ✅ Git binary | Git repositories |
| **sqlite** | ✅ Required | ❌ No | ❌ None | Database files |
| **puppeteer** | ✅ Optional | ✅ Optional | ✅ Chromium | Screenshots/downloads |
| **web-search** | ❌ No | ✅ Required | ❌ None | Internet access |
| **docker** | ❌ No | ❌ No | ✅ Docker socket | `/var/run/docker.sock` |
| **system-monitor** | ❌ No | ❌ No | ✅ Host system | System metrics |
| **time** | ❌ No | ❌ No | ❌ None | No special config |
| **node-sandbox** | ✅ Optional | ❌ No | ❌ None | Code execution |
| **python-sandbox** | ✅ Optional | ❌ No | ✅ Deno | Python execution |
| **self-learning** | ✅ Required | ✅ Required | ❌ None | Docs + storage |
| **image-generation** | ✅ Optional | ✅ Required | ✅ External API | `IMAGE_GEN_API_URL` |
| **everything** | ✅ Optional | ✅ Optional | ❌ None | Demo/testing |
| **sequential-thinking** | ❌ No | ❌ No | ❌ None | No special config |

### Environment Variables

Configure servers via `.env` file:

```bash
# Filesystem access (required for filesystem, git, sqlite, memory, puppeteer, self-learning)
ALLOWED_PATHS=~/,/tmp,/var/log,~/projects,~/Documents

# Network access (required for fetch, web-search, self-learning, image-generation)
ALLOWED_DOMAINS=github.com,npmjs.com,pypi.org,docs.python.org,nodejs.org

# External services (optional)
IMAGE_GEN_API_URL=http://localhost:8000        # For image generation server
DENO_PATH=/path/to/deno                         # For Python sandbox server

# Docker integration (for docker server)
DOCKER_HOST=unix:///var/run/docker.sock        # Docker socket access

# Resource limits
NODE_MEMORY_LIMIT=2048                          # Memory limit in MB
PUPPETEER_HEADLESS=true                         # Browser mode
MCP_LOGS_DIR=./logs                            # Log directory
```

### Platform-Specific Configuration

#### 🐧 Linux Configuration
```bash
# Native installation
ALLOWED_PATHS=~/,/tmp,/var/log,~/projects
ALLOWED_DOMAINS=github.com,npmjs.com,pypi.org
DOCKER_HOST=unix:///var/run/docker.sock

# Container volumes needed
- ~/:/app/home                    # Home directory access
- /var/run/docker.sock:/var/run/docker.sock  # Docker access
- /tmp:/app/tmp                   # Temporary files
```

#### 🍎 macOS Configuration  
```bash
# Similar to Linux but with macOS paths
ALLOWED_PATHS=~/,/tmp,/Users/$(whoami)/Documents
DOCKER_HOST=unix:///var/run/docker.sock

# Container volumes
- ~/:/app/home
- /var/run/docker.sock:/var/run/docker.sock
```

#### 🪟 Windows Configuration
```bash
# Windows paths (use forward slashes)
ALLOWED_PATHS=C:/Users/%USERNAME%,C:/temp
DOCKER_HOST=npipe:////./pipe/docker_engine

# Container volumes (Windows Docker Desktop)
- C:\Users\%USERNAME%:/app/home
- \\.\pipe\docker_engine:\\.\pipe\docker_engine
```

#### 🐧🪟 WSL Configuration
```bash
# WSL can access both Linux and Windows filesystems
ALLOWED_PATHS=/home/user,/mnt/c/Users,/tmp
DOCKER_HOST=unix:///var/run/docker.sock

# Container volumes
- ~/:/app/wsl-home                           # WSL home
- /mnt/c/Users:/app/windows-users           # Windows users
- /var/run/docker.sock:/var/run/docker.sock # Docker access
```

### Security Features

# Resource limits
NODE_MEMORY_LIMIT=2048                    # MB
PUPPETEER_HEADLESS=true
```

### Security Features

- **Path Restrictions**: File operations limited to allowed paths
- **Domain Whitelisting**: Web requests restricted to safe domains  
- **Sandboxed Execution**: Code runs in isolated environments
- **Resource Limits**: Memory and CPU usage controls

## 🧪 Testing

Test all servers:
```bash
node scripts/test-servers.js
```

Test individual servers:
```bash
node servers/filesystem-server.js
```

## 📊 Complete MCP Commands Cheatsheet

### 📁 File Operations (Filesystem Server)
- **"Read the file [path]"** - Read contents of any file
- **"Write [content] to [path]"** - Create or overwrite a file
- **"List files in [directory]"** - Show directory contents
- **"Create directory [path]"** - Make new folders
- **"Delete [file/directory]"** - Remove files or folders
- **"Move/rename [old] to [new]"** - Move or rename files

### 🌐 Web Operations (Fetch Server)
- **"Fetch data from [URL]"** - GET request to allowed domains
- **"POST [data] to [URL]"** - Send data to API endpoints
- **"Download [URL] and save as [file]"** - Download web content
- **"Check if [URL] is accessible"** - Test endpoint availability

### 🧠 Memory Storage (Memory Server)
- **"Remember [key] = [value]"** - Store persistent data
- **"What did I store as [key]?"** - Retrieve stored values
- **"List all remembered items"** - Show all stored keys
- **"Forget [key]"** - Delete specific memory
- **"Clear all memories"** - Reset memory storage

### 📊 Database Operations (SQLite Server)
- **"Query the main database: [SQL]"** - Execute SQL queries
- **"Show tables in [database]"** - List database tables
- **"Describe table [name]"** - Show table structure
- **"Insert into [table] values..."** - Add data
- **"Update/Delete from [table]..."** - Modify data

### 🔧 Git Operations (Git Server)
- **"Show git status"** - Current repository state
- **"Show git log"** - Commit history
- **"Show git diff"** - Uncommitted changes
- **"List git branches"** - Available branches
- **"Initialize git repo in [path]"** - Create new repository

### 🌏 Browser Automation (Puppeteer Server)
- **"Open [URL] in browser"** - Navigate to webpage
- **"Take screenshot of [URL]"** - Capture webpage image
- **"Click on [selector]"** - Interact with elements
- **"Type [text] into [selector]"** - Fill forms
- **"Extract text from [selector]"** - Scrape content
- **"Run JavaScript: [code]"** - Execute browser code

### 🔍 Web Search (Web Search Server)
- **"Search the web for [query]"** - Multi-engine search
- **"Find recent news about [topic]"** - Current events
- **"Search Google for [query]"** - Google-specific search
- **"Search DuckDuckGo for [query]"** - Privacy-focused search

### 🐳 Docker Operations (Docker Server)
- **"List running containers"** - Show active containers
- **"List Docker images"** - Available images
- **"Run [image] container"** - Start new container
- **"Execute [command] in [container]"** - Run commands
- **"Stop container [name/id]"** - Stop running container
- **"Show container logs [name/id]"** - View output

### 📈 System Monitoring (System Monitor Server)
- **"Show CPU usage"** - Processor information
- **"Show memory usage"** - RAM statistics
- **"Show disk usage"** - Storage information
- **"List running processes"** - Active processes
- **"Show network statistics"** - Network interfaces

### 🎨 Image Generation (Image Generation Server)
- **"Generate image: [description]"** - Create AI images
- **"Create a 512x512 image of [prompt]"** - Specific dimensions
- **"Generate [prompt] with high quality"** - Detailed generation
- **"Check image service status"** - Service health

### 🧮 Mathematical Operations (Calculator Server)
- **"Calculate [expression]"** - Basic math
- **"Solve equation: [equation]"** - Algebraic solutions
- **"Convert [value] from [unit] to [unit]"** - Unit conversion
- **"Statistical analysis of [data]"** - Stats functions
- **"Matrix operations: [matrix math]"** - Linear algebra

### 🗺️ Mind Mapping (Markmap Server)
- **"Create mind map from: [markdown]"** - Generate mind map
- **"Convert this outline to mind map"** - Visual hierarchy
- **"Export mind map as [PNG/SVG/JPG]"** - Save visualizations

### ⏰ Time Operations (Time Server)
- **"What time is it in [timezone]?"** - Timezone queries
- **"Convert [time] from [TZ] to [TZ]"** - Time conversion
- **"Show current time"** - Local time
- **"List all timezones"** - Available zones

### 💻 Code Execution (Sandbox Servers)
- **"Run JavaScript: [code]"** - Execute JS safely
- **"Run Python: [code]"** - Execute Python safely
- **"Install npm package [name] and run [code]"** - With dependencies
- **"Test this code: [code]"** - Safe testing environment

### 🧩 Everything Server (Test/Demo)
- **"Show all available MCP tools"** - List capabilities
- **"Test MCP functionality"** - Feature testing
- **"Demo prompt examples"** - Example usage

### 💭 Sequential Thinking
- **"Think through [problem] step by step"** - Structured analysis
- **"Break down [complex task]"** - Task decomposition
- **"Guide me through [process]"** - Step-by-step guidance

### 📚 Self-Learning (Self-Learning Server)
- **"Learn about [topic]"** - Fetch & process official docs
- **"Study [technology] documentation"** - Deep learning mode
- **"Update knowledge on [topic]"** - Refresh learned info
- **"Search learned knowledge for [query]"** - Query knowledge base
- **"What topics have you learned?"** - List learned topics
- **"Summarize your knowledge on [topic]"** - Get learning summary

## 💡 Advanced Usage Examples

### Combining Commands
- **"Read config.json, modify the port to 8080, and save it"**
- **"Search for Python tutorials, learn about Python, then create a practice script"**
- **"Check Docker containers, stop the old one, and run the new image"**
- **"Generate an image of a sunset, save it, then create a mind map about colors"**

### Workflow Examples
1. **Development Workflow**:
   - "Show git status"
   - "Read the README file"
   - "Run the test script"
   - "Commit changes with message: 'Fixed bug'"

2. **Learning Workflow**:
   - "Learn about React hooks"
   - "Create example code using hooks"
   - "Run the code in sandbox"
   - "Save working example to file"

3. **System Administration**:
   - "Check system resources"
   - "List Docker containers"
   - "View logs for web-server container"
   - "Monitor CPU usage"

### Special Features
- **Auto-discovery**: "Learn about [any technology]" automatically finds official docs
- **Persistent Memory**: All stored values survive between conversations
- **Safe Execution**: Code runs in isolated sandboxes
- **Multi-engine Search**: Searches multiple sources simultaneously

## 🔒 Security Considerations

- All servers include access controls and path restrictions
- No network access to unauthorized domains
- Database operations are sandboxed
- Browser automation runs in headless mode with security flags

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

#### All Platforms
1. **Servers not starting**: Check Node.js version (v18+) and dependencies
2. **Claude not recognizing servers**: Restart Claude Desktop App after configuration
3. **Database errors**: Run `node scripts/install-all.js` to reinitialize

#### Linux/macOS Specific
- **Permission errors**: Run `chmod +x servers/*.js scripts/*.js`
- **Path not found**: Check `.env` file paths use forward slashes

#### Windows Specific
- **"node" not recognized**: Add Node.js to PATH or reinstall with installer
- **Scripts won't run**: Use `node scripts/setup.js` instead of `./scripts/setup.js`
- **Path errors**: Ensure `.env` uses double backslashes (`\\`) for Windows paths

#### WSL Specific
- **Claude can't find servers**: Ensure Claude is running on Windows, not WSL
- **Permission denied**: Check Windows permissions on WSL filesystem
- **Path translation errors**: Let setup script handle path conversion automatically

### Logs

Check server logs in the `logs/` directory (or your configured `MCP_LOGS_DIR`) for debugging information.

## 🤖 Multi-IDE Support

These MCP servers work with multiple AI assistants:

### Supported Platforms
- ✅ **Claude Desktop** - Full support, auto-configuration
- ✅ **VSCode + GitHub Copilot** - Agent mode with MCP tools
- ✅ **Visual Studio + Copilot** - Windows IDE support
- ✅ **Cursor IDE** - Drop-in compatibility
- ✅ **JetBrains IDEs** - Via Copilot integration
- ✅ **Any MCP-compatible tool** - Standard protocol

### How MCP Works
MCP (Model Context Protocol) is an open standard that allows AI assistants to:
- Access local tools and resources safely
- Execute code in sandboxed environments
- Query databases and APIs
- Automate development workflows

### Configuration Locations
Each IDE looks for MCP configs in different places:
- **Claude**: `~/.config/claude/mcp-config.json`
- **VSCode**: `.vscode/mcp.json` or workspace settings
- **Visual Studio**: `%USERPROFILE%\.mcp.json`
- **Cursor**: `.cursor/mcp.json`

## 📦 What's Included

All MCP servers are designed to work out-of-the-box with minimal configuration:

- **No hardcoded paths** - Everything uses relative paths or environment variables
- **Cross-platform support** - Works on Linux, macOS, and Windows
- **Multi-IDE compatible** - Same servers work everywhere
- **Optional dependencies** - Core features work without Docker or Deno
- **Secure defaults** - Restrictive permissions that can be customized
- **Easy deployment** - Single repository, simple setup process

## 🤝 Contributing

Contributions are welcome! The codebase is designed to be:
- **Modular** - Each server is independent
- **Extensible** - Easy to add new servers
- **Generic** - No user-specific configuration in code
- **Well-documented** - Clear setup and usage instructions

---

**Made with ❤️ for the Claude community**