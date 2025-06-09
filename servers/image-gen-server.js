#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { IMAGE_GEN_API_URL } from './config.js';

class ImageGenerationServer {
  constructor() {
    this.server = new Server(
      {
        name: "image-generation-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "generate_image",
            description: "Generate an image from a text prompt using Stable Diffusion",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "Text description of the image to generate",
                },
                width: {
                  type: "number",
                  description: "Image width in pixels (default: 512)",
                  default: 512,
                },
                height: {
                  type: "number", 
                  description: "Image height in pixels (default: 512)",
                  default: 512,
                },
                num_inference_steps: {
                  type: "number",
                  description: "Number of denoising steps (default: 20)",
                  default: 20,
                },
                guidance_scale: {
                  type: "number",
                  description: "Guidance scale for prompt adherence (default: 7.5)",
                  default: 7.5,
                },
              },
              required: ["prompt"],
            },
          },
          {
            name: "check_image_service",
            description: "Check if the image generation service is running and healthy",
            inputSchema: {
              type: "object",
              properties: {},
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
          case "generate_image":
            return await this.generateImage(args);
          case "check_image_service":
            return await this.checkImageService();
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

  async generateImage(args) {
    const {
      prompt,
      width = 512,
      height = 512,
      num_inference_steps = 20,
      guidance_scale = 7.5,
    } = args;

    try {
      if (!IMAGE_GEN_API_URL) {
        throw new Error('Image generation service is not configured. Set IMAGE_GEN_API_URL in your .env file.');
      }
      
      const response = await fetch(`${IMAGE_GEN_API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width,
          height,
          num_inference_steps,
          guidance_scale,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `Image generated successfully!\nPrompt: "${prompt}"\nDimensions: ${width}x${height}\nSteps: ${num_inference_steps}\nGuidance: ${guidance_scale}\nImage saved to: ${result.image_path || 'output directory'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async checkImageService() {
    try {
      if (!IMAGE_GEN_API_URL) {
        return {
          content: [
            {
              type: "text",
              text: "Image generation service is not configured. Set IMAGE_GEN_API_URL in your .env file.",
            },
          ],
        };
      }
      
      const response = await fetch(`${IMAGE_GEN_API_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        content: [
          {
            type: "text",
            text: `Image generation service status: ${result.status}\nModel loaded: ${result.model_loaded}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check service: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Image Generation MCP server running on stdio");
  }
}

const server = new ImageGenerationServer();
server.run().catch(console.error);