#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('🔧 MCP Jarvis Setup Utility\n');

// Detect platform and environment
const platform = os.platform();
const isWindows = platform === 'win32';
const isWSL = process.env.WSL_DISTRO_NAME || fs.existsSync('/proc/version') && 
              fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');

console.log(`📍 Platform: ${platform}${isWSL ? ' (WSL)' : ''}`);
console.log(`📍 Architecture: ${os.arch()}`);
console.log(`📍 Node.js: ${process.version}\n`);

// Detect Claude configuration directory
const homeDir = os.homedir();
let claudeConfigPaths = [];

if (isWindows && !isWSL) {
  // Native Windows
  claudeConfigPaths = [
    path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'Claude'),
    path.join(process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'), 'Claude'),
    path.join(homeDir, '.config', 'claude') // Some Windows users might have this
  ];
} else if (isWSL) {
  // WSL - need to find Windows paths
  const windowsHome = execSync('cmd.exe /c "echo %USERPROFILE%"').toString().trim();
  const wslWindowsHome = windowsHome.replace(/\\/g, '/').replace('C:', '/mnt/c');
  
  claudeConfigPaths = [
    // WSL paths to Windows directories
    path.join(wslWindowsHome, 'AppData', 'Roaming', 'Claude'),
    path.join(wslWindowsHome, 'AppData', 'Local', 'Claude'),
    // Also check Linux-style paths in WSL
    path.join(homeDir, '.config', 'claude')
  ];
  
  console.log('🪟 WSL detected - will configure for Windows Claude app');
  console.log(`   Windows home: ${wslWindowsHome}\n`);
} else if (platform === 'darwin') {
  // macOS
  claudeConfigPaths = [
    path.join(homeDir, 'Library', 'Application Support', 'Claude'),
    path.join(homeDir, '.config', 'claude')
  ];
} else {
  // Linux
  claudeConfigPaths = [
    path.join(homeDir, '.config', 'claude'),
    path.join(homeDir, '.local', 'share', 'claude')
  ];
}

// Find or create Claude config directory
let claudeConfigDir = null;
for (const configPath of claudeConfigPaths) {
  if (fs.existsSync(configPath)) {
    claudeConfigDir = configPath;
    break;
  }
}

if (!claudeConfigDir) {
  claudeConfigDir = claudeConfigPaths[0];
  fs.mkdirSync(claudeConfigDir, { recursive: true });
  console.log(`✅ Created Claude config directory: ${claudeConfigDir}`);
} else {
  console.log(`✅ Found Claude config directory: ${claudeConfigDir}`);
}

// Create .env file from .env.example if it doesn't exist
const envPath = path.join(PROJECT_ROOT, '.env');
const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('\n📝 Creating .env file from .env.example...');
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Adjust paths for Windows if needed
  if (isWindows && !isWSL) {
    envContent = envContent.replace(/~\//g, `${homeDir}\\\\`);
    envContent = envContent.replace(/\//g, '\\\\');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file. Please edit it to configure your settings.');
}

// Prepare MCP configuration
const sourceConfig = path.join(PROJECT_ROOT, 'config', 'mcp-config.json');
const targetConfig = path.join(claudeConfigDir, 'mcp-config.json');

// Read and update config
const configContent = JSON.parse(fs.readFileSync(sourceConfig, 'utf8'));

// Update server paths based on platform
for (const [serverName, serverConfig] of Object.entries(configContent.mcpServers)) {
  if (serverConfig.args && serverConfig.args[0]) {
    // Update paths that reference local server files
    if (serverConfig.args[0].startsWith('/opt/MCP/')) {
      if (isWSL) {
        // For WSL, use Windows paths that Claude.exe can understand
        const windowsPath = PROJECT_ROOT.replace('/mnt/c', 'C:').replace(/\//g, '\\');
        serverConfig.args[0] = serverConfig.args[0].replace('/opt/MCP', windowsPath);
        
        // Update command to use wsl.exe
        if (serverConfig.command === 'node') {
          serverConfig.command = 'wsl.exe';
          serverConfig.args.unshift('node');
        } else if (serverConfig.command === 'npx') {
          serverConfig.command = 'wsl.exe';
          serverConfig.args.unshift('npx');
        }
      } else if (isWindows) {
        // Native Windows paths
        serverConfig.args[0] = serverConfig.args[0].replace('/opt/MCP/', `${PROJECT_ROOT}\\`).replace(/\//g, '\\');
      } else {
        // Unix-like systems
        serverConfig.args[0] = serverConfig.args[0].replace('/opt/MCP/', `${PROJECT_ROOT}/`);
      }
    }
    
    // Handle markmap output directory
    if (serverName === 'markmap' && serverConfig.args.includes('--output')) {
      const outputIndex = serverConfig.args.indexOf('--output');
      if (outputIndex !== -1 && outputIndex + 1 < serverConfig.args.length) {
        const outputPath = path.join(PROJECT_ROOT, 'data', 'markmap-output');
        serverConfig.args[outputIndex + 1] = isWindows && !isWSL ? 
          outputPath.replace(/\//g, '\\') : outputPath;
      }
    }
  }
}

// Backup existing config if it exists
if (fs.existsSync(targetConfig)) {
  const backupPath = `${targetConfig}.backup-${Date.now()}`;
  fs.copyFileSync(targetConfig, backupPath);
  console.log(`\n📋 Backed up existing config to: ${backupPath}`);
}

// Write updated configuration
fs.writeFileSync(targetConfig, JSON.stringify(configContent, null, 2));
console.log('✅ Configuration installed successfully');

// Create necessary directories
const directories = [
  path.join(PROJECT_ROOT, 'data'),
  path.join(PROJECT_ROOT, 'data', 'puppeteer-profiles'),
  path.join(PROJECT_ROOT, 'data', 'learned-knowledge'),
  path.join(PROJECT_ROOT, 'data', 'markmap-output'),
  path.join(PROJECT_ROOT, 'logs')
];

console.log('\n📁 Creating data directories...');
for (const dir of directories) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`✅ Created: ${dir}`);
}

// Platform-specific checks
console.log('\n🔍 Checking platform-specific requirements...');

if (isWindows && !isWSL) {
  // Native Windows checks
  console.log('\n🪟 Windows-specific setup:');
  
  // Check for Node.js in PATH
  try {
    execSync('where node', { stdio: 'pipe' });
    console.log('✅ Node.js is in PATH');
  } catch {
    console.log('⚠️  Node.js not in PATH - MCP servers may not start');
  }
  
  // Check for Git Bash or similar
  try {
    execSync('where bash', { stdio: 'pipe' });
    console.log('✅ Bash is available');
  } catch {
    console.log('ℹ️  Bash not found - some features may be limited');
  }
}

if (isWSL) {
  console.log('\n🐧 WSL-specific notes:');
  console.log('   - MCP servers will run in WSL');
  console.log('   - Claude.exe will communicate via wsl.exe');
  console.log('   - File paths are automatically translated');
}

// Check for optional dependencies
console.log('\n🦕 Checking optional dependencies...');

// Docker check
const dockerCommand = isWindows && !isWSL ? 'where docker' : 'which docker';
try {
  execSync(dockerCommand, { stdio: 'pipe' });
  console.log('✅ Docker is installed');
} catch {
  console.log('⚠️  Docker not found. Code sandbox features will be limited.');
  if (isWindows) {
    console.log('   Install Docker Desktop from https://www.docker.com/products/docker-desktop/');
  }
}

// Deno check (different for Windows)
if (!isWindows || isWSL) {
  const checkDeno = spawn('which', ['deno']);
  checkDeno.on('close', (code) => {
    if (code !== 0) {
      console.log('⚠️  Deno not found. Python sandbox will not work.');
      console.log('   To install Deno: curl -fsSL https://deno.land/install.sh | sh');
    } else {
      console.log('✅ Deno is installed');
    }
  });
} else {
  // Windows native
  try {
    execSync('where deno', { stdio: 'pipe' });
    console.log('✅ Deno is installed');
  } catch {
    console.log('⚠️  Deno not found. Python sandbox will not work.');
    console.log('   To install Deno: irm https://deno.land/install.ps1 | iex');
  }
}

console.log('\n✨ Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file to configure your settings');
console.log('2. Run "npm install" to install dependencies');
console.log('3. Run "node scripts/install-all.js" to initialize databases');
console.log('4. Restart Claude desktop app to load the new servers');
console.log('5. Test the servers with "node scripts/test-servers.js"');

console.log('\n📍 Installation path:', PROJECT_ROOT);
console.log('📍 Configuration saved to:', targetConfig);

if (isWSL) {
  console.log('\n💡 WSL Tip: Make sure Claude Desktop is running on Windows, not in WSL!');
}