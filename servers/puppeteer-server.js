#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'puppeteer',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

let browser = null;
const pages = new Map();

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'browser_open',
      description: 'Open a new browser page',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to navigate to' },
          pageId: { type: 'string', description: 'Unique ID for this page' }
        },
        required: ['url', 'pageId']
      }
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of a page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          fullPage: { type: 'boolean', default: false }
        },
        required: ['pageId']
      }
    },
    {
      name: 'browser_click',
      description: 'Click an element on the page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          selector: { type: 'string', description: 'CSS selector' }
        },
        required: ['pageId', 'selector']
      }
    },
    {
      name: 'browser_type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          selector: { type: 'string', description: 'CSS selector' },
          text: { type: 'string', description: 'Text to type' }
        },
        required: ['pageId', 'selector', 'text']
      }
    },
    {
      name: 'browser_close',
      description: 'Close a browser page',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' }
        },
        required: ['pageId']
      }
    },
    {
      name: 'browser_evaluate',
      description: 'Execute JavaScript in the page context',
      inputSchema: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Page ID' },
          script: { type: 'string', description: 'JavaScript to execute' }
        },
        required: ['pageId', 'script']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Lazy load puppeteer
    if (!browser) {
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    }
    
    let result;
    
    switch (name) {
      case 'browser_open':
        if (pages.size >= 5) {
          throw new Error('Maximum number of pages (5) reached');
        }
        const page = await browser.newPage();
        await page.goto(args.url, { waitUntil: 'networkidle2', timeout: 30000 });
        pages.set(args.pageId, page);
        result = `Page opened: ${args.pageId} at ${args.url}`;
        break;
        
      case 'browser_screenshot':
        const screenshotPage = pages.get(args.pageId);
        if (!screenshotPage) throw new Error(`Page not found: ${args.pageId}`);
        
        const screenshot = await screenshotPage.screenshot({
          fullPage: args.fullPage,
          encoding: 'base64'
        });
        result = `Screenshot taken (base64): ${screenshot.substring(0, 50)}...`;
        break;
        
      case 'browser_click':
        const clickPage = pages.get(args.pageId);
        if (!clickPage) throw new Error(`Page not found: ${args.pageId}`);
        
        await clickPage.click(args.selector);
        result = `Clicked element: ${args.selector}`;
        break;
        
      case 'browser_type':
        const typePage = pages.get(args.pageId);
        if (!typePage) throw new Error(`Page not found: ${args.pageId}`);
        
        await typePage.type(args.selector, args.text);
        result = `Typed text into: ${args.selector}`;
        break;
        
      case 'browser_close':
        const closePage = pages.get(args.pageId);
        if (!closePage) throw new Error(`Page not found: ${args.pageId}`);
        
        await closePage.close();
        pages.delete(args.pageId);
        result = `Page closed: ${args.pageId}`;
        break;
        
      case 'browser_evaluate':
        const evalPage = pages.get(args.pageId);
        if (!evalPage) throw new Error(`Page not found: ${args.pageId}`);
        
        const evalResult = await evalPage.evaluate(args.script);
        result = JSON.stringify(evalResult);
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

// Cleanup on exit
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Puppeteer MCP server running on stdio');