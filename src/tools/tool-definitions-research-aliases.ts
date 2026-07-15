import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ASK_USER_PROJECT_SCOPE,
  optionalCredentialProps,
  projectContextProps,
  stableBrandMarkdownProps,
} from "./constants.js";

export const RESEARCH_ALIAS_TOOL_DEFINITIONS: Tool[] = [
  {
    name: "run_niche_research",
    description:
      "Re-enqueue niche_research when a brief already exists (e.g. after submit_brief). For new brands, prefer submit_brief — it persists the brief and starts the pipeline. Does not replace submit_brief for first-time brief submission.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        brief: { type: "object" },
        marketScan: { type: "boolean" },
        sourceFlowId: { type: "string" },
      },
    },
  },
  {
    name: "run_market_scan",
    description:
      "Run competitive density scan synchronously (npm/HN/GitHub legs).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        keywords: { type: "array", items: { type: "string" } },
        productName: { type: "string" },
        oneLiner: { type: "string" },
        audience: { type: "string" },
      },
    },
  },
  {
    name: "web_search",
    description:
      "Run a cached web search (SearXNG/Klaut/Serper chain) for research.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        query: { type: "string" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "run_asset_research",
    description:
      "Run ResearchLayer for a skill without generating the asset (returns synthesis + snapshot). Skills include landing-page, guideline-html, investor-pack (pitch deck + outreach), investor-one-pager, investor-data-room, social-carousel, video-demo-reel, and pipeline skills (niche-research, gtm-strategy, blog-article, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        skillId: {
          type: "string",
          description:
            "Harness skill id, e.g. landing-page, guideline-html, investor-pack, investor-one-pager, investor-data-room.",
        },
        context: { type: "object" },
        refresh: { type: "string", enum: ["full", "light", "auto"] },
      },
      required: ["skillId"],
    },
  },
  {
    name: "generate_asset",
    description:
      "Enqueue full asset harness generation for a skill (research + backend). Common skillId values: landing-page (marketing site), guideline-html (brand guidelines HTML), investor-pack (pitch deck htmlFrame + outreach markdown — requires brand chain, palette, GTM, team, traction preflight), investor-one-pager (PDF one-pager — requires harness-investor-pack on canvas), investor-data-room (diligence checklist markdown — requires deck on canvas). Returns jobId — poll get_asset_status. investor-pack params.team / params.traction override canvas snapshots; params.includeSlides may include competition, financials, roadmap. For ask slide after deck exists, use patch_investor_ask_slide with raiseAmount + useOfFunds.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        skillId: {
          type: "string",
          description:
            "Harness skill id. investor-pack (deck + outreach), investor-one-pager (PDF), investor-data-room (checklist).",
        },
        elementId: { type: "string" },
        flowGroupId: { type: "string" },
        params: {
          type: "object",
          description:
            "Skill-specific harness params. investor-pack: team ({ members: [{ name, role, bio? }] }), traction ({ metrics?, alternativeProof? }), includeSlides (string[]).",
          properties: {
            team: {
              type: "object",
              properties: {
                members: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      bio: { type: "string" },
                    },
                    required: ["name", "role"],
                  },
                },
              },
            },
            traction: {
              type: "object",
              properties: {
                metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" },
                      source: { type: "string" },
                    },
                  },
                },
                alternativeProof: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
              },
            },
            includeSlides: {
              type: "array",
              items: { type: "string" },
              description:
                "Optional slide toggles: competition, financials, roadmap, no-competition.",
            },
          },
        },
        context: { type: "object" },
        forceResearchRefresh: { type: "boolean" },
      },
      required: ["skillId"],
    },
  },
  {
    name: "patch_investor_ask_slide",
    description:
      "Append an ask slide in-place on harness-investor-pack when the deck already exists. Requires raiseAmount (e.g. $2M seed) and useOfFunds array ({ label, percent }). Idempotent when ask slide is already present.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        raiseAmount: { type: "string" },
        useOfFunds: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              percent: { type: "number" },
            },
            required: ["label", "percent"],
          },
        },
        deckElementId: {
          type: "string",
          description:
            "Optional override — defaults to harness-investor-pack element id.",
        },
        headline: { type: "string" },
      },
      required: ["raiseAmount", "useOfFunds"],
    },
  },
  {
    name: "get_asset_status",
    description: "Poll harness or pipeline job status by jobId.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        jobId: { type: "string" },
      },
      required: ["jobId"],
    },
  },
  {
    name: "list_project_assets",
    description: "List recent harness-related jobs for the project.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        skillId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "quiver_generate_svg",
    description:
      "Generate logo SVG via Quiver (server proxy — no API key exposed to agent).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        prompt: { type: "string" },
        model: { type: "string" },
        n: { type: "number" },
        instructions: { type: "string" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "quiver_vectorize_svg",
    description:
      "Vectorize a raster image to SVG via Quiver (server proxy — no API key exposed to agent).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        imageBase64: { type: "string" },
        model: { type: "string" },
        autoCrop: { type: "boolean" },
        targetSize: { type: "number" },
      },
      required: ["imageBase64"],
    },
  },
  {
    name: "brand",
    description: "Alias for get_brand_profile." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "design_md",
    description: "Alias for get_design_md." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "tokens",
    description: "Alias for get_design_tokens." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "guidelines",
    description: "Alias for get_guidelines." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "logos",
    description: "Alias for list_logo_candidates." + ASK_USER_PROJECT_SCOPE,
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
    name: "studio",
    description: "Alias for get_studio_canvas." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "cursor_handoff",
    description: "Alias for get_cursor_handoff.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "export_manifest",
    description: "Alias for get_export_manifest." + ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "get_ui_ux_skills",
    description:
      "List project Cursor UI/UX skills from DB (user-editable). Seeds defaults on first fetch. Use with get_brand_md + get_design_md. Falls back to static catalog when project auth is missing." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "sync_cursor_skills",
    description:
      "Return SKILL.md files to install under .cursor/skills/ in the consumer repo — flexible guides for on-brand UI. Call after get_brand_md + get_design_md; write files then let the agent load skills as needed." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "update_cursor_skill",
    description:
      "Update one project Cursor skill (body, description, enabled, priority). Users can customize Majico defaults per project." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        skillSlug: {
          type: "string",
          description: "Skill directory slug, e.g. majico-brand-handoff",
        },
        name: { type: "string" },
        description: { type: "string" },
        bodyMd: {
          type: "string",
          description: "Markdown body (without YAML frontmatter)",
        },
        phase: {
          type: "string",
          enum: ["prepare", "discover", "implement", "sync", "verify"],
        },
        priority: { type: "number" },
        enabled: { type: "boolean" },
      },
      required: ["skillSlug"],
    },
  },
  {
    name: "generate_brand_md",
    description:
      "Generate a predictable BRAND.md-style markdown scaffold from explicit product inputs.",
    inputSchema: {
      type: "object",
      properties: stableBrandMarkdownProps,
      required: ["productName", "positioningConcept", "audience", "tone"],
    },
  },
];
