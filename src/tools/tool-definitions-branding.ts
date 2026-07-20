import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ASK_USER_PROJECT_SCOPE,
  MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX,
  optionalCredentialProps,
  projectContextProps,
  stableBrandMarkdownProps,
} from "./constants.js";

export const BRANDING_TOOL_DEFINITIONS: Tool[] = [
  {
    name: "get_brand_profile",
    description:
      "Get the brand profile for a Majico project (archetypes, niche intent)." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_design_tokens",
    description:
      "Get design tokens (palette, fonts) for a Majico project." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_logo_svg",
    description:
      "Get the selected logo SVG and metadata for a Majico project." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "list_logo_candidates",
    description:
      "List logo options with rendered SVG previews and pick links. Default: present numbered images and wait for user before select_logo. Exception: if user prompt explicitly asks you to choose (e.g. 'pick option 2 for me'), you may call select_logo with userDelegatedPick: true." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        flowId: {
          type: "string",
          description: "Optional studio flow id scope",
        },
      },
    },
  },
  {
    name: "select_logo",
    description:
      "Select a logo by candidateId, templateId, or raw svg. Default: only after user picks a numbered option or Studio link (userConfirmed: true). Exception: when user prompt explicitly delegates the choice to you (e.g. 'choose the best logo'), pass userDelegatedPick: true — same turn as list_logo_candidates is OK. Creates a Cursor handoff payload.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        candidateId: { type: "string" },
        templateId: { type: "string" },
        svg: { type: "string" },
        flowId: { type: "string" },
        userConfirmed: {
          type: "boolean",
          description:
            "True when user replied with a numbered pick (1-N), confirmed in chat, or saved via browser/Studio pick.",
        },
        userDelegatedPick: {
          type: "boolean",
          description:
            "True when the user prompt explicitly asked you to choose (e.g. 'pick option 2 for me', 'auto-select the best match'). Do not set from heuristics or advisory hints alone.",
        },
      },
    },
  },
  {
    name: "get_cursor_handoff",
    description:
      "Read pending browser→Cursor handoff (logo pick, brand apply). Call after user works in embedded browser. After handoff: sync_cursor_skills if skills are not local, then apply brand using Majico-shipped skills." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "ack_cursor_handoff",
    description:
      "Acknowledge a handoff after applying brand assets in the target repo.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        handoffId: {
          type: "string",
          description: "handoff.id from get_cursor_handoff",
        },
      },
      required: ["handoffId"],
    },
  },
  {
    name: "get_guidelines",
    description:
      "Get full brand guidelines: markdown document and LLM prompt text. Use to transmit brand guidelines into Cursor in one call." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_design_md",
    description:
      "Get DESIGN.md markdown for repo drop-in (design tokens and brand context)." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_brand_md",
    description:
      "Get BRAND.md agent handoff markdown (identity, voice, positioning, visual summary). Prefers enriched worker output when available." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_studio_canvas",
    description:
      "Get the Studio canvas snapshot (elements, truncated agent history)." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_export_manifest",
    description:
      "List exportable assets (file paths) without downloading the ZIP. Use download_export_zip for the full BRAND.md / DESIGN.md / tokens bundle." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "download_export_zip",
    description:
      "Download the full brand export ZIP (BRAND.md, DESIGN.md, guidelines, tokens, logo SVGs). Token-gated. Returns base64 in the MCP response — decode and write files into the consumer repo." +
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "submit_brief",
    description:
      "Submit a product brief and enqueue niche_research. Requires productName and oneLiner. Persists the brief server-side, deducts tokens, and starts the brand pipeline. After job completes: list_palette_options, list_logo_candidates, then get_brand_md / download_export_zip." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        productName: { type: "string", description: "Product or brand name" },
        oneLiner: {
          type: "string",
          description: "One-line positioning statement",
        },
        audience: { type: "string" },
        nicheKeywords: { type: "array", items: { type: "string" } },
        goals: { type: "string" },
        constraints: { type: "string" },
        marketRealityScan: {
          type: "boolean",
          description: "Run competitive density scan after niche research",
        },
        operatingMode: {
          type: "string",
          description: "Studio operating mode (e.g. saas, creator)",
        },
      },
      required: ["productName", "oneLiner"],
    },
  },
  {
    name: "list_projects",
    description:
      "List Majico projects for the authenticated user. Returns relevantProjects (top 3–5 matches by name/description), each with id, name, description, hasBrandData, hasCanvasData. Present relevantProjects to the user when picking an existing project." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps, ...projectContextProps },
    },
  },
  {
    name: "create_project",
    description:
      "Create a new Majico branding project for the authenticated user. Returns project id and projectApiKey. Humans: keep using OAuth in Cursor. Agents: call get_project_api_key (or use the returned key) and store Bearer + X-Majico-Project-Id in gitignored env — never commit keys. Ask the user before creating — prefer list_projects when they may want an existing project.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        name: {
          type: "string",
          description: "Project display name, e.g. Reeldemo Ableton",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_project_api_key",
    description:
      "After OAuth Connect: mint (if missing) or return the reusable project API key for this projectId. Agents store it in gitignored .env.majico / MCP headers (Bearer + X-Majico-Project-Id) and call tools without OAuth thereafter. Optional rotate:true invalidates the previous key. Alias: mint_project_api_key." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        rotate: {
          type: "boolean",
          description:
            "When true, rotate the project API key (invalidates previous key).",
        },
      },
    },
  },
  {
    name: "mint_project_api_key",
    description:
      "Alias for get_project_api_key — mint/return the project API key after OAuth for agent reuse without OAuth on subsequent calls." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        rotate: {
          type: "boolean",
          description:
            "When true, rotate the project API key (invalidates previous key).",
        },
      },
    },
  },
];
