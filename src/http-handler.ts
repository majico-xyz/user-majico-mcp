import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isMcpClientDisconnectError } from "./client-disconnect.js";
import type { CredentialSource } from "./credentials.js";
import { createMajicoMcpServer } from "./server.js";

/**
 * Stateless Streamable HTTP handler for Next.js / edge runtimes.
 * Credentials from HTTP headers override env defaults for tool calls.
 */
export async function handleMcpHttpRequest(
  request: Request,
  headerCredentials?: CredentialSource
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createMajicoMcpServer(headerCredentials);
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } catch (error) {
    if (isMcpClientDisconnectError(error) || request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    throw error;
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}
