/** Agent-facing copy for Majico MCP OAuth connect and plan gates. */

export const MAJICO_MCP_CONNECT_PROMPT =
  "Majico is not connected. Ask the user to open Cursor Settings → MCP → majico → Connect and complete sign-in in the browser.";

export const MAJICO_MCP_PLAN_REQUIRED_PROMPT =
  "Majico is connected, but this action needs more tokens. Ask the user to add tokens at https://majico.xyz/account/billing (Pro one-time or Creator subscription).";

export const MAJICO_MCP_AUTH_AGENT_INSTRUCTIONS =
  "Display the message field verbatim to the user. Do not call other Majico tools until ping returns ok: true without authRequired.";

export const AUTH_FIRST_STEP =
  " First call ping to verify auth. If ping fails, returns authRequired, or tools are unavailable, stop and ask the user to Connect in Cursor Settings → MCP → majico (call mcp_auth for the exact prompt).";

export type McpAuthAction = "connect_oauth" | "upgrade_plan";

export type McpAuthRequiredPayload = {
  authRequired: true;
  action: McpAuthAction;
  message: string;
  agentInstructions: string;
};

export function buildMcpAuthRequiredPayload(
  action: McpAuthAction,
  message: string = action === "upgrade_plan"
    ? MAJICO_MCP_PLAN_REQUIRED_PROMPT
    : MAJICO_MCP_CONNECT_PROMPT
): McpAuthRequiredPayload {
  return {
    authRequired: true,
    action,
    message,
    agentInstructions: MAJICO_MCP_AUTH_AGENT_INSTRUCTIONS,
  };
}
