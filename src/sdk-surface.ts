import type { MajicoClient } from "@majico/sdk";

/**
 * Resources required by @majico/mcp tool dispatch.
 * npm @majico/sdk@1.0.1 omitted these and caused staging
 * "Cannot read properties of undefined" on ping / palette / blog.
 */
export const MCP_REQUIRED_SDK_RESOURCES = [
  "projects",
  "palette",
  "blog",
  "pulse",
  "research",
  "cursorSkills",
] as const;

export type McpRequiredSdkResource =
  (typeof MCP_REQUIRED_SDK_RESOURCES)[number];

/** Returns an error message when the client is too old for this MCP server. */
export function mcpSdkSurfaceError(
  client: Pick<MajicoClient, McpRequiredSdkResource> | Record<string, unknown>
): string | null {
  for (const key of MCP_REQUIRED_SDK_RESOURCES) {
    if (!(key in client) || (client as Record<string, unknown>)[key] == null) {
      return (
        "Incompatible @majico/sdk: need >= 1.1.0 with projects, palette, blog, " +
        "pulse, research, and cursorSkills. Published 1.0.1 is too old for " +
        "@majico/mcp >= 0.8.0."
      );
    }
  }
  return null;
}
