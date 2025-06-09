#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { KNOWLEDGE_DIR, isDomainAllowed } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SelfLearningServer {
  constructor() {
    this.server = new Server(
      {
        name: "self-learning-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.knowledgeDir = KNOWLEDGE_DIR;
    this.setupToolHandlers();
    this.setupResourceHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });

    // Ensure knowledge directory exists
    this.ensureKnowledgeDir();
  }

  async ensureKnowledgeDir() {
    try {
      await fs.mkdir(this.knowledgeDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create knowledge directory:", error);
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "learn_topic",
            description: "Learn about a specific topic by fetching and processing its official documentation",
            inputSchema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic/technology to learn about (e.g., 'React', 'Docker', 'Python')",
                },
                official_docs_url: {
                  type: "string",
                  description: "Official documentation URL to fetch from (optional - will auto-discover if not provided)",
                },
                depth: {
                  type: "string",
                  enum: ["overview", "detailed", "comprehensive"],
                  description: "Learning depth level (default: detailed)",
                  default: "detailed",
                },
              },
              required: ["topic"],
            },
          },
          {
            name: "search_learned_knowledge",
            description: "Search through previously learned knowledge on topics",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for learned knowledge",
                },
                topic: {
                  type: "string",
                  description: "Specific topic to search within (optional)",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "list_learned_topics",
            description: "List all topics that have been learned about",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "update_topic_knowledge",
            description: "Update knowledge about a previously learned topic with latest information",
            inputSchema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic to update knowledge for",
                },
              },
              required: ["topic"],
            },
          },
          {
            name: "get_learning_summary",
            description: "Get a summary of what has been learned about a specific topic",
            inputSchema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "The topic to get learning summary for",
                },
              },
              required: ["topic"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "learn_topic":
            return await this.learnTopic(args);
          case "search_learned_knowledge":
            return await this.searchLearnedKnowledge(args);
          case "list_learned_topics":
            return await this.listLearnedTopics();
          case "update_topic_knowledge":
            return await this.updateTopicKnowledge(args);
          case "get_learning_summary":
            return await this.getLearningSummary(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const topics = await this.getLearnedTopicsList();
        const resources = topics.map(topic => ({
          uri: `learned-knowledge://${topic}`,
          name: `${topic} Knowledge`,
          description: `Learned knowledge about ${topic}`,
          mimeType: "text/markdown",
        }));

        return { resources };
      } catch (error) {
        return { resources: [] };
      }
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const topic = uri.replace("learned-knowledge://", "");
      
      try {
        const knowledgeFile = path.join(this.knowledgeDir, `${topic}.md`);
        const content = await fs.readFile(knowledgeFile, 'utf-8');
        
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read knowledge for topic: ${topic}`);
      }
    });
  }

  async learnTopic(args) {
    const { topic, official_docs_url, depth = "detailed" } = args;
    const timestamp = new Date().toISOString();
    
    try {
      // Step 1: Discover official documentation URL if not provided
      let docsUrl = official_docs_url;
      if (!docsUrl) {
        docsUrl = await this.discoverOfficialDocs(topic);
      }

      // Step 2: Fetch documentation content
      const docContent = await this.fetchDocumentation(docsUrl, depth);

      // Step 3: Process and structure the content
      const processedKnowledge = await this.processDocumentation(topic, docContent, docsUrl, depth);

      // Step 4: Store the learned knowledge
      await this.storeKnowledge(topic, processedKnowledge, timestamp);

      // Step 5: Create learning summary
      const summary = await this.createLearningSummary(topic, processedKnowledge);

      return {
        content: [
          {
            type: "text",
            text: `Successfully learned about "${topic}"!\n\n${summary}\n\nKnowledge stored and available for future queries.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to learn about ${topic}: ${error.message}`);
    }
  }

  async discoverOfficialDocs(topic) {
    const commonDocPatterns = {
      'react': 'https://react.dev/learn',
      'vue': 'https://vuejs.org/guide/',
      'angular': 'https://angular.io/docs',
      'docker': 'https://docs.docker.com/',
      'kubernetes': 'https://kubernetes.io/docs/',
      'python': 'https://docs.python.org/3/',
      'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'typescript': 'https://www.typescriptlang.org/docs/',
      'nodejs': 'https://nodejs.org/en/docs/',
      'express': 'https://expressjs.com/en/guide/',
      'fastapi': 'https://fastapi.tiangolo.com/',
      'django': 'https://docs.djangoproject.com/',
      'flask': 'https://flask.palletsprojects.com/',
      'postgresql': 'https://www.postgresql.org/docs/',
      'mongodb': 'https://docs.mongodb.com/',
      'redis': 'https://redis.io/docs/',
      'aws': 'https://docs.aws.amazon.com/',
      'git': 'https://git-scm.com/doc',
    };

    const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (commonDocPatterns[normalizedTopic]) {
      return commonDocPatterns[normalizedTopic];
    }

    // Try to search for official docs
    const searchQuery = `${topic} official documentation site:docs`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }

  async fetchDocumentation(url, depth) {
    try {
      console.error(`Fetching documentation from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MCP-SelfLearning/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      
      // Convert HTML to text/markdown for processing
      return this.convertHtmlToMarkdown(content);
    } catch (error) {
      throw new Error(`Failed to fetch documentation: ${error.message}`);
    }
  }

  convertHtmlToMarkdown(html) {
    // Basic HTML to Markdown conversion
    let markdown = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n\s*\n/g, '\n\n');

    return markdown.trim();
  }

  async processDocumentation(topic, content, sourceUrl, depth) {
    const processedAt = new Date().toISOString();
    
    // Extract key sections based on depth
    const sections = this.extractDocumentationSections(content, depth);
    
    return {
      topic,
      sourceUrl,
      processedAt,
      depth,
      sections,
      summary: this.generateTopicSummary(sections),
      keyFeatures: this.extractKeyFeatures(sections),
      codeExamples: this.extractCodeExamples(content),
      lastUpdated: processedAt,
    };
  }

  extractDocumentationSections(content, depth) {
    const lines = content.split('\n');
    const sections = {};
    let currentSection = '';
    let currentContent = [];

    for (const line of lines) {
      if (line.match(/^#{1,4}\s/)) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.replace(/^#{1,4}\s/, '').trim();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    // Limit sections based on depth
    if (depth === 'overview') {
      const importantSections = ['Introduction', 'Getting Started', 'Overview', 'Quick Start'];
      const filteredSections = {};
      for (const [key, value] of Object.entries(sections)) {
        if (importantSections.some(important => key.toLowerCase().includes(important.toLowerCase()))) {
          filteredSections[key] = value;
        }
      }
      return Object.keys(filteredSections).length > 0 ? filteredSections : Object.fromEntries(Object.entries(sections).slice(0, 3));
    }

    return sections;
  }

  generateTopicSummary(sections) {
    const firstSections = Object.values(sections).slice(0, 2).join('\n\n');
    return firstSections.substring(0, 500) + (firstSections.length > 500 ? '...' : '');
  }

  extractKeyFeatures(sections) {
    const features = [];
    for (const [title, content] of Object.entries(sections)) {
      if (title.toLowerCase().includes('feature') || title.toLowerCase().includes('key') || title.toLowerCase().includes('benefit')) {
        const lines = content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
        features.push(...lines.map(line => line.trim().substring(1).trim()));
      }
    }
    return features;
  }

  extractCodeExamples(content) {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.map(block => block.replace(/```/g, '').trim()).slice(0, 5);
  }

  async storeKnowledge(topic, knowledge, timestamp) {
    const filename = `${topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`;
    const filepath = path.join(this.knowledgeDir, filename);
    
    const markdownContent = this.formatKnowledgeAsMarkdown(knowledge);
    
    await fs.writeFile(filepath, markdownContent, 'utf-8');
    
    // Also store metadata
    const metadataFile = path.join(this.knowledgeDir, `${filename}.meta.json`);
    await fs.writeFile(metadataFile, JSON.stringify({
      topic: knowledge.topic,
      sourceUrl: knowledge.sourceUrl,
      learnedAt: timestamp,
      lastUpdated: knowledge.lastUpdated,
      depth: knowledge.depth,
    }, null, 2));
  }

  formatKnowledgeAsMarkdown(knowledge) {
    let markdown = `# ${knowledge.topic}\n\n`;
    markdown += `**Source:** ${knowledge.sourceUrl}\n`;
    markdown += `**Learned:** ${knowledge.processedAt}\n`;
    markdown += `**Depth:** ${knowledge.depth}\n\n`;
    
    markdown += `## Summary\n\n${knowledge.summary}\n\n`;
    
    if (knowledge.keyFeatures.length > 0) {
      markdown += `## Key Features\n\n`;
      for (const feature of knowledge.keyFeatures) {
        markdown += `- ${feature}\n`;
      }
      markdown += '\n';
    }

    if (knowledge.codeExamples.length > 0) {
      markdown += `## Code Examples\n\n`;
      for (let i = 0; i < knowledge.codeExamples.length; i++) {
        markdown += `### Example ${i + 1}\n\n\`\`\`\n${knowledge.codeExamples[i]}\n\`\`\`\n\n`;
      }
    }

    markdown += `## Documentation Sections\n\n`;
    for (const [title, content] of Object.entries(knowledge.sections)) {
      markdown += `### ${title}\n\n${content}\n\n`;
    }

    return markdown;
  }

  async searchLearnedKnowledge(args) {
    const { query, topic } = args;
    
    try {
      const topics = await this.getLearnedTopicsList();
      const results = [];

      for (const topicName of topics) {
        if (topic && !topicName.toLowerCase().includes(topic.toLowerCase())) {
          continue;
        }

        const knowledge = await this.loadTopicKnowledge(topicName);
        if (this.searchInKnowledge(knowledge, query)) {
          results.push({
            topic: topicName,
            relevantSections: this.findRelevantSections(knowledge, query),
            lastUpdated: knowledge.lastUpdated,
          });
        }
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No knowledge found matching: "${query}"`,
            },
          ],
        };
      }

      let response = `Found ${results.length} result(s) for "${query}":\n\n`;
      for (const result of results) {
        response += `**${result.topic}** (updated: ${result.lastUpdated})\n`;
        for (const section of result.relevantSections) {
          response += `- ${section}\n`;
        }
        response += '\n';
      }

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  searchInKnowledge(knowledge, query) {
    const searchText = `${knowledge.topic} ${knowledge.summary} ${Object.values(knowledge.sections).join(' ')}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  }

  findRelevantSections(knowledge, query) {
    const relevant = [];
    const queryLower = query.toLowerCase();
    
    for (const [title, content] of Object.entries(knowledge.sections)) {
      if (title.toLowerCase().includes(queryLower) || content.toLowerCase().includes(queryLower)) {
        relevant.push(title);
      }
    }
    
    return relevant.slice(0, 3);
  }

  async listLearnedTopics() {
    try {
      const topics = await this.getLearnedTopicsList();
      
      if (topics.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No topics learned yet. Use the 'learn_topic' tool to start learning!",
            },
          ],
        };
      }

      let response = `Learned topics (${topics.length}):\n\n`;
      for (const topic of topics) {
        const metadata = await this.loadTopicMetadata(topic);
        response += `- **${topic}** (learned: ${metadata.learnedAt.split('T')[0]}, depth: ${metadata.depth})\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list topics: ${error.message}`);
    }
  }

  async updateTopicKnowledge(args) {
    const { topic } = args;
    
    try {
      const metadata = await this.loadTopicMetadata(topic);
      
      // Re-learn with same parameters
      return await this.learnTopic({
        topic: metadata.topic,
        official_docs_url: metadata.sourceUrl,
        depth: metadata.depth,
      });
    } catch (error) {
      throw new Error(`Failed to update ${topic}: ${error.message}`);
    }
  }

  async getLearningSummary(args) {
    const { topic } = args;
    
    try {
      const knowledge = await this.loadTopicKnowledge(topic);
      
      let summary = `# ${knowledge.topic} - Learning Summary\n\n`;
      summary += `**Source:** ${knowledge.sourceUrl}\n`;
      summary += `**Last Updated:** ${knowledge.lastUpdated}\n`;
      summary += `**Learning Depth:** ${knowledge.depth}\n\n`;
      summary += `## Summary\n\n${knowledge.summary}\n\n`;
      
      if (knowledge.keyFeatures.length > 0) {
        summary += `## Key Features (${knowledge.keyFeatures.length})\n\n`;
        for (const feature of knowledge.keyFeatures.slice(0, 5)) {
          summary += `- ${feature}\n`;
        }
        summary += '\n';
      }

      summary += `## Available Sections (${Object.keys(knowledge.sections).length})\n\n`;
      for (const title of Object.keys(knowledge.sections).slice(0, 10)) {
        summary += `- ${title}\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get summary for ${topic}: ${error.message}`);
    }
  }

  async getLearnedTopicsList() {
    try {
      const files = await fs.readdir(this.knowledgeDir);
      return files
        .filter(file => file.endsWith('.md') && !file.includes('.meta'))
        .map(file => file.replace('.md', '').replace(/_/g, ' '));
    } catch (error) {
      return [];
    }
  }

  async loadTopicKnowledge(topic) {
    const filename = `${topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`;
    const filepath = path.join(this.knowledgeDir, filename);
    
    const content = await fs.readFile(filepath, 'utf-8');
    return this.parseKnowledgeFromMarkdown(content);
  }

  async loadTopicMetadata(topic) {
    const filename = `${topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md.meta.json`;
    const filepath = path.join(this.knowledgeDir, filename);
    
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  parseKnowledgeFromMarkdown(markdown) {
    // Simple parser to extract knowledge structure from stored markdown
    const lines = markdown.split('\n');
    const knowledge = {
      topic: '',
      sourceUrl: '',
      processedAt: '',
      depth: '',
      summary: '',
      keyFeatures: [],
      codeExamples: [],
      sections: {},
      lastUpdated: '',
    };

    let currentSection = '';
    let currentContent = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        knowledge.topic = line.replace('# ', '');
      } else if (line.startsWith('**Source:**')) {
        knowledge.sourceUrl = line.replace('**Source:** ', '');
      } else if (line.startsWith('**Learned:**')) {
        knowledge.processedAt = line.replace('**Learned:** ', '');
        knowledge.lastUpdated = knowledge.processedAt;
      } else if (line.startsWith('**Depth:**')) {
        knowledge.depth = line.replace('**Depth:** ', '');
      } else if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection && currentContent.length > 0) {
          if (currentSection === 'Summary') {
            knowledge.summary = currentContent.join('\n').trim();
          } else {
            knowledge.sections[currentSection] = currentContent.join('\n').trim();
          }
        }
        currentSection = line.replace(/^#{2,3}\s/, '');
        currentContent = [];
      } else if (line.startsWith('- ') && currentSection === 'Key Features') {
        knowledge.keyFeatures.push(line.replace('- ', ''));
      } else if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && currentContent.length > 0) {
          knowledge.codeExamples.push(currentContent.join('\n'));
          currentContent = [];
        }
      } else if (inCodeBlock) {
        currentContent.push(line);
      } else if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    }

    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'Summary') {
        knowledge.summary = currentContent.join('\n').trim();
      } else {
        knowledge.sections[currentSection] = currentContent.join('\n').trim();
      }
    }

    return knowledge;
  }

  async createLearningSummary(topic, knowledge) {
    const sectionsCount = Object.keys(knowledge.sections).length;
    const featuresCount = knowledge.keyFeatures.length;
    const examplesCount = knowledge.codeExamples.length;

    return `📚 Learning Summary for "${topic}":
- Source: ${knowledge.sourceUrl}
- Depth: ${knowledge.depth}
- Sections processed: ${sectionsCount}
- Key features identified: ${featuresCount}
- Code examples extracted: ${examplesCount}
- Summary: ${knowledge.summary.substring(0, 200)}${knowledge.summary.length > 200 ? '...' : ''}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Self-Learning MCP server running on stdio");
  }
}

const server = new SelfLearningServer();
server.run().catch(console.error);