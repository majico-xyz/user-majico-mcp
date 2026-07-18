#!/usr/bin/env node
/**
 * user-majico MCP server (stdio): brand profile, design tokens, logo, guidelines, studio.
 * Set MAJICO_API_URL, MAJICO_PROJECT_ID, MAJICO_API_KEY once; per-call overrides still work.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readEnvCredentials } from "./credentials.js";
import { createMajicoMcpServer } from "./server.js";

export { createMajicoMcpServer } from "./server.js";
export { handleMcpHttpRequest } from "./http-handler.js";
export {
  handleMajicoToolCall,
  listMcpTools,
  classifyMcpTool,
  MCP_LLM_TOOL_NAMES,
  partitionMcpToolNames,
  MAJICO_TOOLS,
  MAJICO_USER_TOOLS,
  MAJICO_ADMIN_BOOTSTRAP_TOOLS,
  MCP_SERVER_VERSION,
} from "./tools.js";
export type { McpToolKind } from "./tools.js";
export {
  readEnvCredentials,
  resolveCredentials,
  createClientFromCredentials,
} from "./credentials.js";
export {
  AUTH_FIRST_STEP,
  MAJICO_MCP_AUTH_AGENT_INSTRUCTIONS,
  MAJICO_MCP_CONNECT_PROMPT,
  MAJICO_MCP_PLAN_REQUIRED_PROMPT,
  buildMcpAuthRequiredPayload,
} from "./auth-prompt.js";
export type { McpAuthAction, McpAuthRequiredPayload } from "./auth-prompt.js";

async function main() {
  const transport = new StdioServerTransport();
  const server = createMajicoMcpServer(readEnvCredentials());
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
