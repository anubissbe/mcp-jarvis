# Contributing to MCP Jarvis

Thank you for your interest in contributing to MCP Jarvis! This guide will help you get started.

## 🤝 Ways to Contribute

- **Bug Reports**: Open an issue describing the bug
- **Feature Requests**: Suggest new MCP servers or capabilities
- **Code Contributions**: Submit PRs for bug fixes or new features
- **Documentation**: Improve README, add examples, fix typos
- **Testing**: Test on different platforms and report issues

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-jarvis.git
   cd mcp-jarvis
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- Use ES6+ JavaScript features
- Follow existing code patterns
- Add JSDoc comments for new functions
- Keep servers modular and independent

### Creating a New MCP Server
1. Create server file in `/servers/your-server.js`
2. Follow the MCP SDK patterns (see existing servers)
3. Update `config.js` if adding new settings
4. Add to IDE config generator
5. Document in README

### Testing
- Test your changes locally
- Ensure cross-platform compatibility
- Run `node scripts/test-servers.js`
- Test with at least one AI assistant (Claude, VSCode, etc.)

## 🔄 Pull Request Process

1. Update README.md with any new features
2. Ensure `.env.example` includes new variables
3. Run the IDE config generator if adding servers
4. Create descriptive commit messages
5. Open PR with clear description of changes

### PR Title Format
- `feat: Add new feature`
- `fix: Fix specific bug`
- `docs: Update documentation`
- `chore: Maintenance task`

## 🏗️ Project Structure

```
mcp-jarvis/
├── servers/           # MCP server implementations
│   ├── config.js     # Shared configuration
│   └── *.js          # Individual servers
├── scripts/          # Setup and utility scripts
├── config/           # MCP configurations
└── .github/          # GitHub workflows
```

## 🔒 Security

- Never commit credentials or API keys
- Use environment variables for sensitive data
- Follow principle of least privilege
- Validate all user inputs
- Keep dependencies updated

## 📋 Checklist

Before submitting a PR:
- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No hardcoded paths or credentials
- [ ] Works on Linux/macOS/Windows
- [ ] IDE configs regenerated if needed

## 💬 Questions?

- Open a GitHub issue
- Start a discussion
- Check existing issues/PRs

Thank you for contributing! 🎉