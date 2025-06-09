import { config } from 'dotenv';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Helper to expand ~ to home directory
function expandPath(path) {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  if (path.startsWith('./')) {
    return resolve(PROJECT_ROOT, path.slice(2));
  }
  return path;
}

// Base directories
export const MCP_BASE_DIR = expandPath(process.env.MCP_BASE_DIR || PROJECT_ROOT);
export const MCP_DATA_DIR = expandPath(process.env.MCP_DATA_DIR || join(MCP_BASE_DIR, 'data'));
export const MCP_LOGS_DIR = expandPath(process.env.MCP_LOGS_DIR || join(MCP_BASE_DIR, 'logs'));

// Filesystem allowed paths
export const ALLOWED_PATHS = process.env.ALLOWED_PATHS
  ? process.env.ALLOWED_PATHS.split(',').map(p => expandPath(p.trim()))
  : [homedir(), '/tmp', '/var/log', MCP_BASE_DIR];

// Fetch allowed domains
export const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  : [
      'github.com',
      'githubusercontent.com',
      'npmjs.com',
      'pypi.org',
      'docs.python.org',
      'developer.mozilla.org',
      'react.dev',
      'vuejs.org',
      'angular.io',
      'nodejs.org',
      'expressjs.com',
      'fastapi.tiangolo.com',
      'docs.djangoproject.com',
      'flask.palletsprojects.com',
      'postgresql.org',
      'mongodb.com',
      'redis.io',
      'docs.aws.amazon.com',
      'git-scm.com'
    ];

// Image generation settings
export const IMAGE_GEN_API_URL = process.env.IMAGE_GEN_API_URL || null;

// Deno path for Python sandbox
export const DENO_PATH = process.env.DENO_PATH || 'deno';

// Browser settings
export const PUPPETEER_HEADLESS = process.env.PUPPETEER_HEADLESS !== 'false';
export const PUPPETEER_DATA_DIR = expandPath(
  process.env.PUPPETEER_DATA_DIR || join(MCP_DATA_DIR, 'puppeteer-profiles')
);

// Memory settings
export const NODE_MEMORY_LIMIT = parseInt(process.env.NODE_MEMORY_LIMIT || '2048', 10);

// Debug mode
export const DEBUG = process.env.DEBUG === 'true';

// Database paths
export const DB_PATHS = {
  main: join(MCP_DATA_DIR, 'main.db'),
  analytics: join(MCP_DATA_DIR, 'analytics.db'),
  logs: join(MCP_DATA_DIR, 'logs.db')
};

// Memory store path
export const MEMORY_STORE_PATH = join(MCP_DATA_DIR, 'memory-store.json');

// Knowledge directory for self-learning
export const KNOWLEDGE_DIR = join(MCP_DATA_DIR, 'learned-knowledge');

// Markmap output directory
export const MARKMAP_OUTPUT_DIR = expandPath(
  process.env.MARKMAP_OUTPUT_DIR || join(MCP_DATA_DIR, 'markmap-output')
);

// Export utility functions
export function isPathAllowed(requestedPath) {
  const normalizedPath = resolve(requestedPath);
  return ALLOWED_PATHS.some(allowedPath => 
    normalizedPath.startsWith(resolve(allowedPath))
  );
}

export function isDomainAllowed(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}