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

export async function dispatchResearchAssetsTool(
  name: string,
  args: Record<string, unknown> | undefined,
  client: MajicoClient
): Promise<ToolCallResult | null> {
  switch (name) {
    case "push_design_tokens_to_figma":
      return toolJson(
        await client.figma.pushDesignTokens({
          fileKey: args?.fileKey as string | undefined,
        })
      );
    case "sync_project_assets_to_figma":
      return toolJson(
        await client.figma.syncProjectAssets({
          fileKey: args?.fileKey as string | undefined,
        })
      );
    case "import_repo": {
      const owner = args?.owner as string | undefined;
      const repo = args?.repo as string | undefined;
      if (!owner?.trim() || !repo?.trim()) {
        return toolError("owner and repo are required.");
      }
      return toolJson(
        await client.git.importRepo({
          owner: owner.trim(),
          repo: repo.trim(),
          ref: args?.ref as string | undefined,
          provider: args?.provider as "github" | "gitlab" | undefined,
        })
      );
    }
    case "publish_landing_page":
      return toolJson(
        await client.git.publishLandingPage({
          target: args?.target as
            | "new_repo"
            | "existing_repo"
            | "org_landing"
            | undefined,
          provider: args?.provider as "github" | "gitlab" | undefined,
          elementId: args?.elementId as string | undefined,
          html: args?.html as string | undefined,
          owner: args?.owner as string | undefined,
          repo: args?.repo as string | undefined,
          branch: args?.branch as string | undefined,
          orgLandingPath: args?.orgLandingPath as string | undefined,
        })
      );
    case "run_niche_research":
      return toolJson(
        await client.research.runNicheResearch({
          brief: args?.brief as Record<string, unknown> | undefined,
          marketScan:
            typeof args?.marketScan === "boolean" ? args.marketScan : undefined,
          sourceFlowId: args?.sourceFlowId as string | undefined,
        })
      );
    case "run_market_scan":
      return toolJson(
        await client.research.runMarketScan({
          keywords: args?.keywords as string[] | undefined,
          productName: args?.productName as string | undefined,
          oneLiner: args?.oneLiner as string | undefined,
          audience: args?.audience as string | undefined,
        })
      );
    case "web_search": {
      const query = args?.query as string | undefined;
      if (!query?.trim()) return toolError("query is required.");
      return toolJson(
        await client.research.webSearch({
          query: query.trim(),
          limit: typeof args?.limit === "number" ? args.limit : undefined,
        })
      );
    }
    case "run_asset_research": {
      const skillId = args?.skillId as string | undefined;
      if (!skillId?.trim()) return toolError("skillId is required.");
      return toolJson(
        await client.research.runAssetResearch({
          skillId: skillId.trim(),
          context: args?.context as Record<string, unknown> | undefined,
          refresh: args?.refresh as "full" | "light" | "auto" | undefined,
        })
      );
    }
    case "generate_asset": {
      const skillId = args?.skillId as string | undefined;
      if (!skillId?.trim()) return toolError("skillId is required.");
      return toolJson(
        await client.assets.generate({
          skillId: skillId.trim(),
          elementId: args?.elementId as string | undefined,
          flowGroupId: args?.flowGroupId as string | undefined,
          params: args?.params as Record<string, unknown> | undefined,
          context: args?.context as Record<string, unknown> | undefined,
          forceResearchRefresh: args?.forceResearchRefresh === true,
        })
      );
    }
    case "patch_investor_ask_slide": {
      const raiseAmount = args?.raiseAmount as string | undefined;
      const useOfFunds = args?.useOfFunds as
        | Array<{ label: string; percent: number }>
        | undefined;
      if (!raiseAmount?.trim()) return toolError("raiseAmount is required.");
      if (!Array.isArray(useOfFunds) || useOfFunds.length === 0) {
        return toolError("useOfFunds is required.");
      }
      return toolJson(
        await client.assets.patchInvestorAskSlide({
          raiseAmount: raiseAmount.trim(),
          useOfFunds,
          deckElementId: args?.deckElementId as string | undefined,
          headline: args?.headline as string | undefined,
        })
      );
    }
    case "get_asset_status": {
      const jobId = args?.jobId as string | undefined;
      if (!jobId?.trim()) return toolError("jobId is required.");
      return toolJson(await client.assets.getStatus({ jobId: jobId.trim() }));
    }
    case "list_project_assets":
      return toolJson(
        await client.assets.list({
          skillId: args?.skillId as string | undefined,
          limit: typeof args?.limit === "number" ? args.limit : undefined,
        })
      );
    case "quiver_generate_svg": {
      const prompt = args?.prompt as string | undefined;
      if (!prompt?.trim()) return toolError("prompt is required.");
      return toolJson(
        await client.quiver.generateSvg({
          prompt: prompt.trim(),
          model: args?.model as string | undefined,
          n: typeof args?.n === "number" ? args.n : undefined,
          instructions: args?.instructions as string | undefined,
        })
      );
    }
    case "quiver_vectorize_svg": {
      const imageBase64 = args?.imageBase64 as string | undefined;
      if (!imageBase64?.trim()) return toolError("imageBase64 is required.");
      return toolJson(
        await client.quiver.vectorizeSvg({
          imageBase64: imageBase64.trim(),
          model: args?.model as string | undefined,
          autoCrop: args?.autoCrop === true,
          targetSize:
            typeof args?.targetSize === "number" ? args.targetSize : undefined,
        })
      );
    }
    default:
      return null;
  }
}
