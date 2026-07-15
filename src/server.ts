import { Server } from "@modelcontextprotocol/sdk/server";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { CredentialSource } from "./credentials.js";
import {
  buildMcpServerIcons,
  MAJICO_MCP_SERVER_DESCRIPTION,
  MAJICO_MCP_SERVER_TITLE,
  MAJICO_MCP_WEBSITE_URL,
} from "./server-branding.js";
import {
  handleMajicoToolCall,
  listMcpTools,
  MCP_SERVER_VERSION,
} from "./tools.js";

export function createMajicoMcpServer(
  defaultCredentials?: CredentialSource
): Server {
  const server = new Server(
    {
      name: "user-majico",
      title: MAJICO_MCP_SERVER_TITLE,
      version: MCP_SERVER_VERSION,
      description: MAJICO_MCP_SERVER_DESCRIPTION,
      websiteUrl: MAJICO_MCP_WEBSITE_URL,
      icons: buildMcpServerIcons(
        defaultCredentials?.publicBaseUrl,
        defaultCredentials?.iconBaseUrl
      ),
    },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listMcpTools({
      includeAdminTools: Boolean(defaultCredentials?.includeAdminTools),
    }),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleMajicoToolCall(
      name,
      (args ?? {}) as Record<string, unknown>,
      defaultCredentials
    );
  });

  return server;
}
