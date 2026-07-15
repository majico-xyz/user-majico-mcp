import type { MajicoClient } from "@majico/sdk";
import type { CredentialSource, ResolvedCredentials } from "../credentials.js";
import type {
  McpContentBlock,
  PresentContext,
} from "../present-interactive.js";
import {
  presentCursorHandoff,
  presentLogoCandidates,
  presentPaletteOptions,
  presentTweetDrafts,
} from "../present-interactive.js";
import { bootstrapProjectViaAgent } from "../agent-bootstrap.js";
import {
  buildUiUxSkillsHandoffPayload,
  renderUiUxSkillsHandoffMarkdown,
} from "../ui-ux-skills.js";
import { buildMcpAuthRequiredPayload } from "../auth-prompt.js";
import {
  buildProjectSelectionFields,
  PROJECT_SELECTION_HINT,
} from "../project-selection.js";
import { pickRelevantProjects } from "../project-relevance.js";
import { inferRepoNameHints } from "../project-selection-hints.js";
import { validateUserPickGate } from "../user-pick-policy.js";
import {
  MCP_SERVER_VERSION,
  resolveProjectRelevanceContext,
} from "./constants.js";
import {
  type ToolCallResult,
  toolError,
  toolJson,
  toolPresent,
  requireStringArg,
  buildStableBrandMarkdown,
  presentContext,
  toolAuthRequired,
  clientFromArgs,
} from "./tool-call-helpers.js";

/** Pre-client tools and plan gate checks. */
export async function handlePreClientToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
  defaultCredentials?: CredentialSource
): Promise<ToolCallResult | null> {
  if (name === "bootstrap_project") {
    if (!defaultCredentials?.includeAdminTools) {
      return toolError(
        "bootstrap_project is admin-only. Use create_project or list_projects after OAuth login, or pass X-Majico-Agent-Secret for server automation."
      );
    }
    const projectName = args?.name as string | undefined;
    if (!projectName?.trim()) return toolError("name is required.");
    const { project } = await bootstrapProjectViaAgent(projectName.trim());
    return toolJson(project);
  }

  if (name === "generate_brand_md") {
    return buildStableBrandMarkdown(args);
  }

  if (name === "get_ui_ux_skills") {
    const clientOrError = await clientFromArgs(args, defaultCredentials);
    if ("content" in clientOrError) {
      return toolJson({
        ...buildUiUxSkillsHandoffPayload(),
        markdown: renderUiUxSkillsHandoffMarkdown(),
        source: "static",
        message:
          "Connect Majico MCP with project scope for DB-backed editable skills.",
      });
    }
    const { client } = clientOrError;
    return toolJson(await client.cursorSkills.list());
  }

  if (name === "mcp_auth") {
    return toolJson(buildMcpAuthRequiredPayload("connect_oauth"));
  }

  if (
    (name === "ping" || name === "health") &&
    defaultCredentials?.planRequired
  ) {
    return toolJson({
      ok: false,
      ...buildMcpAuthRequiredPayload("upgrade_plan"),
      auth: defaultCredentials.auth ?? "oauth",
      userId: defaultCredentials.userId ?? null,
      projectId: defaultCredentials.projectId ?? null,
    });
  }

  return null;
}
