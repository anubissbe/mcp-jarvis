# MCP Jarvis - Enhanced Claude Capabilities

A comprehensive collection of Model Context Protocol (MCP) servers that extend Claude's capabilities with filesystem access, web requests, database operations, browser automation, and more.

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
- **Everything Server** - Comprehensive toolset (via npx)

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
- Claude Desktop App
- Git

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anubissbe/mcp-jarvis.git /opt/MCP
   cd /opt/MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the setup script:**
   ```bash
   node scripts/setup.js
   ```

4. **Initialize servers and databases:**
   ```bash
   node scripts/install-all.js
   ```

5. **Restart Claude Desktop App** to load the new servers

### Manual Setup

If you prefer manual setup:

1. Copy the MCP configuration to Claude:
   ```bash
   cp config/mcp-config.json ~/.config/claude/mcp-config.json
   ```

2. Make server scripts executable:
   ```bash
   chmod +x servers/*.js scripts/*.js
   ```

3. Create necessary directories:
   ```bash
   mkdir -p data/puppeteer-profiles logs
   ```

## 🔧 Configuration

The MCP servers are configured in `config/mcp-config.json`. Each server can be enabled/disabled by adding or removing it from the configuration.

### Security Settings

- **Filesystem Server**: Limited to `/home`, `/opt`, `/tmp`, `/var/log` directories
- **Fetch Server**: Restricted to whitelisted domains
- **Git Server**: Access limited to allowed repository paths
- **SQLite Server**: Pre-configured databases with query limits

### Customization

Edit the server files in `/servers/` to modify:
- Allowed paths and domains
- Database configurations
- Resource limits
- Additional functionality

## 🧪 Testing

Test all servers:
```bash
node scripts/test-servers.js
```

Test individual servers:
```bash
node servers/filesystem-server.js
```

## 📊 Available Tools

Once installed, Claude will have access to tools including:

- **File Operations**: `read_file`, `write_file`, `list_directory`, `create_directory`, `delete_file`
- **Web Requests**: `fetch` with support for GET, POST, PUT, DELETE, PATCH
- **Memory**: `memory_set`, `memory_get`, `memory_delete`, `memory_list`, `memory_clear`
- **Git**: `git_status`, `git_log`, `git_diff`, `git_branch`, `git_init`
- **Database**: `sqlite_query`, `sqlite_schema`
- **Browser**: `browser_open`, `browser_screenshot`, `browser_click`, `browser_type`, `browser_evaluate`
- **Docker**: `docker_ps`, `docker_images`, `docker_run`, `docker_exec`, `docker_stop`
- **System**: `cpu_info`, `memory_info`, `disk_usage`, `network_info`, `process_list`

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

This project is private and intended for personal use.

## 🐛 Troubleshooting

### Common Issues

1. **Servers not starting**: Check Node.js version and dependencies
2. **Permission errors**: Ensure proper file permissions with `chmod +x`
3. **Claude not recognizing servers**: Restart Claude Desktop App after configuration
4. **Database errors**: Run `node scripts/install-all.js` to reinitialize

### Logs

Check server logs in the `/opt/MCP/logs/` directory for debugging information.

---

**Note**: This setup is user-specific and will only work for the user who installed it on this machine. To use on other machines, clone this repository and run the setup process.