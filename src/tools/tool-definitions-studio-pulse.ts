import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ASK_USER_PROJECT_SCOPE,
  MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX,
  optionalCredentialProps,
  projectContextProps,
  stableBrandMarkdownProps,
} from "./constants.js";

export const STUDIO_PULSE_TOOL_DEFINITIONS: Tool[] = [
  {
    name: "ping",
    description:
      "Pre-flight check: auth mode, user, project scope, and whether brand canvas data exists. Call this first before other branding tools. If authRequired is true or the MCP session is not connected, stop and ask the user to Connect in Cursor Settings → MCP → majico (call mcp_auth for the exact prompt). When project scope is not confirmed, returns projectSelectionRequired and relevantProjects (top 3–5 by name/description match) — present options to the user; never auto-switches scope. Response includes skillsGuidance: Majico auto-ships Cursor skills. On UI/landing/SEO/motion work call sync_cursor_skills / get_ui_ux_skills without waiting for another user request." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        ...projectContextProps,
      },
    },
  },
  {
    name: "health",
    description:
      "Alias for ping. Call ping first to verify auth; if authRequired, stop and ask the user to Connect before other tools." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        ...projectContextProps,
      },
    },
  },
  {
    name: "update_studio_html_frame",
    description:
      "Patch one htmlFrame element on the Studio canvas by element ID. HTML is sanitized server-side.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        elementId: {
          type: "string",
          description: "Canvas element ID of the htmlFrame to update",
        },
        html: {
          type: "string",
          description: "New HTML content for the frame",
        },
      },
      required: ["elementId", "html"],
    },
  },
  {
    name: "generate_creative",
    description:
      "Enqueue a creative_batch job to generate hero/social raster images for template slots.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string", description: "Default hero" },
        prompt: { type: "string" },
        slots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slotId: { type: "string" },
              prompt: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "refine_creative",
    description:
      "Enqueue creative_refine to adjust an existing slot asset (Grok edit or OpenAI edit when source exists).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string", description: "Default hero" },
        refinePrompt: { type: "string" },
        prompt: { type: "string", description: "Alias for refinePrompt" },
      },
    },
  },
  {
    name: "list_palette_options",
    description:
      "List color scheme options for a project. Always call before select_palette — do not guess. Default: present numbered options with swatches, then wait for user choice (do not call select_palette in the same turn). Exception: if user prompt explicitly asks you to choose (e.g. 'auto-select the Reeldemo match'), you may call select_palette with userDelegatedPick: true in the same turn.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "select_palette",
    description:
      "Persist a color scheme by optionId from list_palette_options. Default: only after user confirms option number (1–3) or browser/Studio pick (userConfirmed: true). Exception: when user prompt explicitly delegates the choice (e.g. 'pick option 2 for me', 'choose the best dark scheme'), pass userDelegatedPick: true — same turn as list_palette_options is OK. Returns cursorHandoff for repo apply.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        optionId: {
          type: "string",
          description: "optionId from list_palette_options",
        },
        userConfirmed: {
          type: "boolean",
          description:
            "True when user replied 1/2/3, confirmed in chat, or saved via browser palette picker.",
        },
        userDelegatedPick: {
          type: "boolean",
          description:
            "True when the user prompt explicitly asked you to choose (e.g. 'auto-select the Reeldemo match'). Do not set from heuristics or reeldemoFitAdvisory alone.",
        },
      },
      required: ["optionId"],
    },
  },
  {
    name: "get_pulse_status",
    description:
      "Check whether Pulse/X is linked for this project and return org stats.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "generate_tweet_drafts",
    description:
      "Generate 2–3 tweet draft variants using brand + Pulse post context. Always list results and wait for user before select_tweet_draft.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        prompt: { type: "string", description: "Optional goal or angle" },
      },
    },
  },
  {
    name: "select_tweet_draft",
    description:
      "Persist chosen tweet draft to canvas tweet-draft widget + emit handoff.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        draftId: { type: "string" },
        text: { type: "string" },
      },
      required: ["draftId", "text"],
    },
  },
  {
    name: "list_pulse_posts",
    description:
      "List top or recent X posts for Pulse-linked projects. Use for canvas widgets and summaries.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        sort: { type: "string", enum: ["best", "recent"] },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_calendar_slots",
    description:
      "List upcoming X publish slots from content-plan sync. Use list→choose before approve or schedule.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        limit: { type: "number" },
        platform: { type: "string", description: "Default X" },
      },
    },
  },
  {
    name: "generate_post_variants",
    description:
      "Generate 2–3 tweet variants for a publish slot. List results; wait for user before select_post_variant.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string" },
        prompt: { type: "string" },
      },
      required: ["slotId"],
    },
  },
  {
    name: "select_post_variant",
    description:
      "Persist chosen variant on publish slot + sync Studio post-slot widget.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string" },
        variantId: { type: "string" },
      },
      required: ["slotId", "variantId"],
    },
  },
  {
    name: "approve_publish_slot",
    description:
      "Human approval for a publish slot; increments trust counter toward autopost.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string" },
      },
      required: ["slotId"],
    },
  },
  {
    name: "schedule_publish_slot",
    description:
      "Set scheduled_at on a publish slot (ISO datetime). Never auto-pick time without user confirm.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        slotId: { type: "string" },
        scheduledAt: { type: "string", description: "ISO 8601 datetime" },
      },
      required: ["slotId", "scheduledAt"],
    },
  },
  {
    name: "get_performance_insights",
    description:
      "Read-only closed-loop insights from classifier + engagement for agent narratives.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_product_ops_view",
    description:
      "Unified brand + pulse + jobs payload for Cursor product-ops canvas. After calling, write or refresh the user's .canvas.tsx — do not dump JSON in chat.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
];
