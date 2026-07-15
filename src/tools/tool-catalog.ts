import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  MCP_AUTH_TOOL_DESCRIPTION,
  withBrandingAuthStep,
} from "./constants.js";
import { BRANDING_TOOL_DEFINITIONS } from "./tool-definitions-branding.js";
import { STUDIO_PULSE_TOOL_DEFINITIONS } from "./tool-definitions-studio-pulse.js";
import { BLOG_GIT_TOOL_DEFINITIONS } from "./tool-definitions-blog-git.js";
import { RESEARCH_ALIAS_TOOL_DEFINITIONS } from "./tool-definitions-research-aliases.js";

const MAJICO_USER_TOOLS_RAW: Tool[] = [
  ...BRANDING_TOOL_DEFINITIONS,
  ...STUDIO_PULSE_TOOL_DEFINITIONS,
  ...BLOG_GIT_TOOL_DEFINITIONS,
  ...RESEARCH_ALIAS_TOOL_DEFINITIONS,
];

export const MAJICO_USER_TOOLS: Tool[] = [
  {
    name: "mcp_auth",
    description: MCP_AUTH_TOOL_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  ...MAJICO_USER_TOOLS_RAW.map(withBrandingAuthStep),
];

/** Admin-only bootstrap tools — not listed unless X-Majico-Agent-Secret is present. */
export const MAJICO_ADMIN_BOOTSTRAP_TOOLS: Tool[] = [
  {
    name: "bootstrap_project",
    description:
      "Admin automation: create or reuse a project via Agent API (server MAJICO_AGENT_API_SECRET + X-Majico-Agent-Secret). Not for normal Cursor branding workflows.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project display name, e.g. klaut.pro portal",
        },
      },
      required: ["name"],
    },
  },
];

/** Full tool catalog including admin bootstrap (documentation / stdio with agent env). */
export const MAJICO_TOOLS: Tool[] = [
  ...MAJICO_USER_TOOLS,
  ...MAJICO_ADMIN_BOOTSTRAP_TOOLS,
];

/**
 * Tools exposed on tools/list for a given MCP session.
 * Bootstrap tools require admin agent secret — never shown to normal OAuth/API-key users.
 */
export function listMcpTools(options?: {
  includeAdminTools?: boolean;
}): Tool[] {
  if (options?.includeAdminTools) return MAJICO_TOOLS;
  return MAJICO_USER_TOOLS;
}
