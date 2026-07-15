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

export async function dispatchBrandingStudioTool(
  name: string,
  args: Record<string, unknown> | undefined,
  client: MajicoClient,
  creds: ResolvedCredentials,
  ctx: PresentContext,
  defaultCredentials?: CredentialSource
): Promise<ToolCallResult | null> {
  switch (name) {
    case "ping":
    case "health": {
      const ping = await client.projects.ping();
      const list = await client.projects.list();
      const explicitProjectId = args?.projectId as string | undefined;
      const relevanceContext = resolveProjectRelevanceContext(args);
      const selection = buildProjectSelectionFields({
        projects: list.projects,
        activeProjectId: creds.projectId,
        activeProjectName: ping.projectName,
        explicitProjectId,
        consumerRepoPath: relevanceContext.consumerRepoPath,
        requestContext: relevanceContext.requestContext,
      });
      return toolJson({
        ok: true,
        auth: defaultCredentials?.auth ?? "api_key",
        userId: defaultCredentials?.userId ?? ping.userId,
        projectId: creds.projectId,
        projectName: ping.projectName,
        hasBrandData: ping.hasBrandData,
        hasCanvasData: ping.hasCanvasData,
        previewToken: ping.previewToken ?? null,
        previewPickerUrl: ping.previewPickerUrl ?? null,
        baseUrl: creds.baseUrl,
        serverVersion: MCP_SERVER_VERSION,
        ...(selection ?? {}),
      });
    }
    case "list_projects": {
      const list = await client.projects.list();
      const relevantProjects = pickRelevantProjects(
        list.projects,
        resolveProjectRelevanceContext(args)
      );
      return toolJson({
        ...list,
        relevantProjects,
        totalProjectCount: list.projects.length,
        hint: PROJECT_SELECTION_HINT,
      });
    }
    case "create_project": {
      const projectName = requireStringArg(args, "name");
      if (!projectName) return toolError("name is required.");
      return toolJson(await client.projects.create(projectName));
    }
    case "brand":
    case "get_brand_profile":
      return toolJson(await client.brand.get());
    case "tokens":
    case "get_design_tokens":
      return toolJson(await client.tokens.get());
    case "get_logo_svg":
      return toolJson(await client.logo.get());
    case "logos":
    case "list_logo_candidates":
      return toolPresent(
        await presentLogoCandidates(
          await client.logo.listCandidates(args?.flowId as string | undefined),
          ctx
        )
      );
    case "select_logo": {
      const pickError = validateUserPickGate(
        {
          userConfirmed: args?.userConfirmed === true,
          userDelegatedPick: args?.userDelegatedPick === true,
        },
        "select_logo"
      );
      if (pickError) return toolError(pickError);
      return toolJson(
        await client.logo.select({
          candidateId: args?.candidateId as string | undefined,
          templateId: args?.templateId as string | undefined,
          svg: args?.svg as string | undefined,
          flowId: args?.flowId as string | undefined,
        })
      );
    }
    case "cursor_handoff":
    case "get_cursor_handoff":
      return toolPresent(
        presentCursorHandoff(await client.cursorHandoff.get())
      );
    case "ack_cursor_handoff": {
      const handoffId = args?.handoffId as string | undefined;
      if (!handoffId?.trim()) return toolError("handoffId is required.");
      return toolJson(await client.cursorHandoff.ack(handoffId.trim()));
    }
    case "guidelines":
    case "get_guidelines":
      return toolJson(await client.guidelines.get());
    case "design_md":
    case "get_design_md":
      return toolJson(await client.designMd.get());
    case "get_brand_md":
      return toolJson(await client.brandMd.get());
    case "sync_cursor_skills":
      return toolJson(await client.cursorSkills.syncInstallManifest());
    case "update_cursor_skill": {
      const skillSlug = requireStringArg(args, "skillSlug");
      if (!skillSlug) return toolError("skillSlug is required.");
      return toolJson(
        await client.cursorSkills.update({
          skillSlug,
          name: args?.name as string | undefined,
          description: args?.description as string | undefined,
          bodyMd: args?.bodyMd as string | undefined,
          phase: args?.phase as string | undefined,
          priority:
            typeof args?.priority === "number" ? args.priority : undefined,
          enabled:
            typeof args?.enabled === "boolean" ? args.enabled : undefined,
        })
      );
    }
    case "studio":
    case "get_studio_canvas":
      return toolJson(await client.studio.get());
    case "export_manifest":
    case "get_export_manifest":
      return toolJson(await client.export.getManifest());
    case "download_export_zip": {
      const buffer = await client.export.downloadZip();
      const bytes = Buffer.from(buffer);
      const manifest = await client.export.getManifest().catch(() => null);
      const slug =
        manifest?.productName?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ||
        "brand";
      return toolJson({
        filename: `${slug}-brand-export.zip`,
        sizeBytes: bytes.length,
        base64: bytes.toString("base64"),
        manifest: manifest ?? undefined,
        agentInstructions:
          "Decode base64 and write the ZIP to disk, or extract BRAND.md, DESIGN.md, and tokens/ into the consumer repo.",
      });
    }
    case "submit_brief": {
      const productName = args?.productName as string | undefined;
      const oneLiner = args?.oneLiner as string | undefined;
      if (!productName?.trim() || !oneLiner?.trim()) {
        return toolError("productName and oneLiner are required.");
      }
      return toolJson(
        await client.brief.submit({
          productName: productName.trim(),
          oneLiner: oneLiner.trim(),
          audience: args?.audience as string | undefined,
          nicheKeywords: args?.nicheKeywords as string[] | undefined,
          goals: args?.goals as string | undefined,
          constraints: args?.constraints as string | undefined,
          marketRealityScan: args?.marketRealityScan === true,
          operatingMode: args?.operatingMode as string | undefined,
        })
      );
    }
    case "update_studio_html_frame": {
      const elementId = args?.elementId as string | undefined;
      const html = args?.html as string | undefined;
      if (!elementId?.trim() || typeof html !== "string") {
        return toolError("elementId and html are required.");
      }
      return toolJson(
        await client.studio.patchHtmlFrame({
          elementId: elementId.trim(),
          html,
        })
      );
    }
    case "generate_creative":
      return toolJson(
        await client.creative.generate({
          slotId: args?.slotId as string | undefined,
          prompt: args?.prompt as string | undefined,
          slots: args?.slots as
            | Array<{ slotId: string; prompt?: string }>
            | undefined,
        })
      );
    case "refine_creative":
      return toolJson(
        await client.creative.refine({
          slotId: args?.slotId as string | undefined,
          refinePrompt: args?.refinePrompt as string | undefined,
          prompt: args?.prompt as string | undefined,
        })
      );
    case "list_palette_options": {
      const consumerRepoPath =
        (args?.consumerRepo as string | undefined)?.trim() ||
        process.env.MAJICO_CONSUMER_REPO?.trim() ||
        process.cwd();
      return toolPresent(
        await presentPaletteOptions(await client.palette.listCandidates(), {
          ...ctx,
          repoHints: inferRepoNameHints(consumerRepoPath),
        })
      );
    }
    case "select_palette": {
      const optionId = args?.optionId as string | undefined;
      if (!optionId?.trim()) return toolError("optionId is required.");
      const pickError = validateUserPickGate(
        {
          userConfirmed: args?.userConfirmed === true,
          userDelegatedPick: args?.userDelegatedPick === true,
        },
        "select_palette"
      );
      if (pickError) return toolError(pickError);
      return toolJson(
        await client.palette.select({ optionId: optionId.trim() })
      );
    }
    default:
      return null;
  }
}
