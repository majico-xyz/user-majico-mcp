import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AUTH_FIRST_STEP } from "../auth-prompt.js";
import { MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX } from "../skills-agent-guidance.js";

export const MCP_SERVER_VERSION = "0.9.1";

export const ASK_USER_PROJECT_SCOPE =
  " Before other tools: call ping, then ask the user whether to use an existing Majico project (list_projects) or create_project for this request; pass projectId on tool calls once confirmed.";

export const MCP_AUTH_TOOL_DESCRIPTION =
  "Authenticate the Majico MCP server with OAuth in Cursor. If ping fails or any tool returns authRequired: true, stop and ask the user to Connect before other tools. Call this tool to get the exact user-facing prompt to display verbatim.";

export { MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX };

const BRANDING_TOOL_NAMES = new Set([
  "get_brand_profile",
  "get_design_tokens",
  "get_logo_svg",
  "list_logo_candidates",
  "select_logo",
  "get_cursor_handoff",
  "ack_cursor_handoff",
  "get_guidelines",
  "get_design_md",
  "get_brand_md",
  "get_ui_ux_skills",
  "sync_cursor_skills",
  "update_cursor_skill",
  "get_studio_canvas",
  "get_export_manifest",
  "download_export_zip",
  "submit_brief",
  "list_projects",
  "create_project",
  "get_project_api_key",
  "mint_project_api_key",
  "list_palette_options",
  "select_palette",
  "update_studio_html_frame",
  "generate_creative",
  "refine_creative",
  "push_design_tokens_to_figma",
  "sync_project_assets_to_figma",
  "import_repo",
  "publish_landing_page",
  "brand",
  "tokens",
  "logos",
  "guidelines",
  "design_md",
  "studio",
  "export_manifest",
  "cursor_handoff",
]);

export function withBrandingAuthStep(tool: Tool): Tool {
  if (!BRANDING_TOOL_NAMES.has(tool.name)) return tool;
  return {
    ...tool,
    description: AUTH_FIRST_STEP + tool.description,
  };
}

export const optionalCredentialProps = {
  projectId: {
    type: "string",
    description:
      "Majico project UUID (optional when connected via Cursor OAuth or env defaults)",
  },
  apiKey: {
    type: "string",
    description:
      "Project API key (optional when connected via Cursor OAuth or env defaults)",
  },
} as const;

export const projectContextProps = {
  consumerRepo: {
    type: "string",
    description:
      "Consumer repo path or folder name (e.g. reeldemo-ableton) for relevance ranking. Defaults to MAJICO_CONSUMER_REPO or process.cwd().",
  },
  requestContext: {
    type: "string",
    description:
      "Short summary of the user's request (product, task, audience) to rank the 3–5 most relevant projects by name and description.",
  },
} as const;

export function resolveProjectRelevanceContext(args?: Record<string, unknown>) {
  return {
    consumerRepoPath:
      (args?.consumerRepo as string | undefined)?.trim() ||
      process.env.MAJICO_CONSUMER_REPO?.trim() ||
      process.cwd(),
    requestContext: (args?.requestContext as string | undefined)?.trim(),
  };
}

export const stableBrandMarkdownProps = {
  productName: {
    type: "string",
    description: "Product or brand name",
  },
  positioningConcept: {
    type: "string",
    description: "One-line positioning or concept statement",
  },
  audience: {
    type: "string",
    description: "Primary audience or customer segment",
  },
  tone: {
    type: "string",
    description: "Brand tone or voice guidelines",
  },
} as const;
