#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create MCP server instance
const server = new McpServer({
  name: 'time-server',
  version: '1.0.0',
});

// Add time tools using the new SDK API
server.tool(
  'get_current_time',
  {
    timezone: z.string().optional().describe('Timezone (optional, defaults to local)'),
  },
  async ({ timezone }) => {
    try {
      const now = new Date();
      const options = {
        timeZone: timezone || undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };

      const timeString = now.toLocaleString('en-US', options);
      const isoString = now.toISOString();
      
      return {
        content: [
          {
            type: 'text',
            text: `Current time: ${timeString}\nISO format: ${isoString}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting time: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'convert_timezone',
  {
    time: z.string().describe('Time in ISO format or readable format'),
    from_timezone: z.string().describe('Source timezone'),
    to_timezone: z.string().describe('Target timezone'),
  },
  async ({ time, from_timezone, to_timezone }) => {
    try {
      // Parse the input time
      let date;
      if (time.includes('T')) {
        date = new Date(time);
      } else {
        // Try to parse as a readable format
        date = new Date(time);
      }

      if (isNaN(date.getTime())) {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid time format. Please use ISO format (2023-12-25T12:00:00Z) or a readable format.',
            },
          ],
        };
      }

      const fromOptions = {
        timeZone: from_timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };

      const toOptions = {
        timeZone: to_timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };

      const fromTime = date.toLocaleString('en-US', fromOptions);
      const toTime = date.toLocaleString('en-US', toOptions);

      return {
        content: [
          {
            type: 'text',
            text: `Time conversion:\nFrom ${from_timezone}: ${fromTime}\nTo ${to_timezone}: ${toTime}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error converting timezone: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'format_time',
  {
    time: z.string().describe('Time in ISO format'),
    format: z.string().optional().describe('Format style (short, medium, long, full)'),
    locale: z.string().optional().describe('Locale (e.g., en-US, fr-FR)'),
  },
  async ({ time, format = 'medium', locale = 'en-US' }) => {
    try {
      const date = new Date(time);
      
      if (isNaN(date.getTime())) {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid time format. Please use ISO format (2023-12-25T12:00:00Z).',
            },
          ],
        };
      }

      const formatOptions = {
        short: { dateStyle: 'short', timeStyle: 'short' },
        medium: { dateStyle: 'medium', timeStyle: 'medium' },
        long: { dateStyle: 'long', timeStyle: 'long' },
        full: { dateStyle: 'full', timeStyle: 'full' }
      };

      const options = formatOptions[format] || formatOptions.medium;
      const formatted = date.toLocaleString(locale, options);

      return {
        content: [
          {
            type: 'text',
            text: `Formatted time: ${formatted}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error formatting time: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'list_timezones',
  {},
  async () => {
    try {
      // Common timezone list
      const commonTimezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver', 
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'Pacific/Auckland'
      ];

      return {
        content: [
          {
            type: 'text',
            text: `Common timezones:\n${commonTimezones.join('\n')}\n\nFor a complete list, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing timezones: ${error.message}`,
          },
        ],
      };
    }
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Time MCP server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(console.error);
}