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

export async function dispatchPulseBlogTool(
  name: string,
  args: Record<string, unknown> | undefined,
  client: MajicoClient
): Promise<ToolCallResult | null> {
  switch (name) {
    case "get_pulse_status":
      return toolJson(await client.pulse.getStatus());
    case "generate_tweet_drafts":
      return toolPresent(
        presentTweetDrafts(
          await client.pulse.generateTweetDrafts({
            prompt: args?.prompt as string | undefined,
          })
        )
      );
    case "select_tweet_draft": {
      const draftId = args?.draftId as string | undefined;
      const text = args?.text as string | undefined;
      if (!draftId?.trim() || !text?.trim()) {
        return toolError("draftId and text are required.");
      }
      return toolJson(
        await client.pulse.selectTweetDraft({
          draftId: draftId.trim(),
          text: text.trim(),
        })
      );
    }
    case "list_pulse_posts":
      return toolJson(
        await client.pulse.listPosts({
          sort: args?.sort as "best" | "recent" | undefined,
          limit: typeof args?.limit === "number" ? args.limit : undefined,
        })
      );
    case "list_calendar_slots":
      return toolJson(
        await client.pulse.listCalendarSlots({
          limit: typeof args?.limit === "number" ? args.limit : undefined,
          platform: args?.platform as string | undefined,
        })
      );
    case "generate_post_variants": {
      const slotId = args?.slotId as string | undefined;
      if (!slotId?.trim()) return toolError("slotId is required.");
      return toolJson(
        await client.pulse.generatePostVariants({
          slotId: slotId.trim(),
          prompt: args?.prompt as string | undefined,
        })
      );
    }
    case "select_post_variant": {
      const slotId = args?.slotId as string | undefined;
      const variantId = args?.variantId as string | undefined;
      if (!slotId?.trim() || !variantId?.trim()) {
        return toolError("slotId and variantId are required.");
      }
      return toolJson(
        await client.pulse.selectPostVariant({
          slotId: slotId.trim(),
          variantId: variantId.trim(),
        })
      );
    }
    case "approve_publish_slot": {
      const slotId = args?.slotId as string | undefined;
      if (!slotId?.trim()) return toolError("slotId is required.");
      return toolJson(
        await client.pulse.approvePublishSlot({ slotId: slotId.trim() })
      );
    }
    case "schedule_publish_slot": {
      const slotId = args?.slotId as string | undefined;
      const scheduledAt = args?.scheduledAt as string | undefined;
      if (!slotId?.trim() || !scheduledAt?.trim()) {
        return toolError("slotId and scheduledAt are required.");
      }
      return toolJson(
        await client.pulse.schedulePublishSlot({
          slotId: slotId.trim(),
          scheduledAt: scheduledAt.trim(),
        })
      );
    }
    case "get_performance_insights":
      return toolJson(await client.pulse.getPerformanceInsights());
    case "get_product_ops_view":
      return toolJson(await client.pulse.getProductOpsView());
    case "list_blog_posts":
      return toolJson(
        await client.blog.listPosts({
          limit: typeof args?.limit === "number" ? args.limit : undefined,
        })
      );
    case "get_blog_post": {
      const postId = args?.postId as string | undefined;
      if (!postId?.trim()) return toolError("postId is required.");
      return toolJson(await client.blog.getPost(postId.trim()));
    }
    case "get_blog_seo_handoff": {
      return toolJson(
        await client.blog.seoHandoff({
          postId: (args?.postId as string | undefined)?.trim() || undefined,
        })
      );
    }
    case "suggest_blog_opportunities":
      return toolJson(await client.blog.suggestOpportunities());
    case "run_blog_research": {
      const concept = args?.concept;
      if (!concept || typeof concept !== "object") {
        return toolError("concept object is required.");
      }
      return toolJson(
        await client.blog.runResearch({
          concept: concept as Record<string, unknown>,
          articleType: args?.articleType as string | undefined,
          postId: args?.postId as string | undefined,
        })
      );
    }
    case "generate_blog_outline": {
      const concept = args?.concept;
      const dossier = args?.dossier;
      if (!concept || typeof concept !== "object") {
        return toolError("concept object is required.");
      }
      if (!dossier || typeof dossier !== "object") {
        return toolError("dossier object is required.");
      }
      return toolJson(
        await client.blog.generateOutline({
          concept: concept as Record<string, unknown>,
          dossier: dossier as Record<string, unknown>,
          articleType: args?.articleType as string | undefined,
          postId: args?.postId as string | undefined,
        })
      );
    }
    case "approve_blog_outline": {
      const postId = args?.postId as string | undefined;
      if (!postId?.trim()) return toolError("postId is required.");
      return toolJson(
        await client.blog.approveOutline({ postId: postId.trim() })
      );
    }
    case "generate_blog_section": {
      const postId = args?.postId as string | undefined;
      const sectionId = args?.sectionId as string | undefined;
      if (!postId?.trim() || !sectionId?.trim()) {
        return toolError("postId and sectionId are required.");
      }
      return toolJson(
        await client.blog.generateSection({
          postId: postId.trim(),
          sectionId: sectionId.trim(),
          approve: args?.approve === true,
        })
      );
    }
    case "assemble_blog_post": {
      const postId = args?.postId as string | undefined;
      if (!postId?.trim()) return toolError("postId is required.");
      return toolJson(
        await client.blog.assemble({
          postId: postId.trim(),
          skipSeoGate: args?.skipSeoGate === true,
        })
      );
    }
    case "publish_blog_post": {
      const postId = args?.postId as string | undefined;
      if (!postId?.trim()) return toolError("postId is required.");
      const scope = args?.scope as "project" | "platform" | undefined;
      return toolJson(
        await client.blog.publish({
          postId: postId.trim(),
          scope:
            scope === "platform" || scope === "project" ? scope : undefined,
          force: args?.force === true,
        })
      );
    }
    default:
      return null;
  }
}
