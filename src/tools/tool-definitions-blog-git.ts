import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ASK_USER_PROJECT_SCOPE,
  optionalCredentialProps,
  projectContextProps,
  stableBrandMarkdownProps,
} from "./constants.js";

export const BLOG_GIT_TOOL_DEFINITIONS: Tool[] = [
  {
    name: "list_blog_posts",
    description:
      "List SEO blog drafts for this project (slug, status, generation_status). Start here for blog workflow.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        limit: { type: "number", description: "Max posts (default 20)" },
      },
    },
  },
  {
    name: "get_blog_post",
    description:
      "Fetch one blog draft with outline, sections, dossier, and body_md when assembled.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        postId: { type: "string" },
      },
      required: ["postId"],
    },
  },
  {
    name: "suggest_blog_opportunities",
    description:
      "Suggest research-backed SEO article ideas from project ICP + GTM context. First step for new articles.",
    inputSchema: {
      type: "object",
      properties: { ...optionalCredentialProps },
    },
  },
  {
    name: "run_blog_research",
    description:
      "Deep research + dossier for a blog concept (from suggest_blog_opportunities). Required before generate_blog_outline.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        concept: {
          type: "object",
          description:
            "BlogConcept: id, question, primaryKeyword, workingTitle, pillar, intent",
        },
        articleType: { type: "string" },
        postId: { type: "string", description: "Optional existing draft id" },
      },
      required: ["concept"],
    },
  },
  {
    name: "generate_blog_outline",
    description:
      "Generate whole-article SEO outline from concept + dossier. Present sections; user must approve before drafting.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        concept: { type: "object" },
        dossier: { type: "object" },
        articleType: { type: "string" },
        postId: { type: "string" },
      },
      required: ["concept", "dossier"],
    },
  },
  {
    name: "approve_blog_outline",
    description:
      "Approve outline gate (≥3 sections) before generate_blog_section. Call after user confirms outline.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        postId: { type: "string" },
      },
      required: ["postId"],
    },
  },
  {
    name: "generate_blog_section",
    description:
      "Draft one section body (token-billed). Requires approved outline. Pass sectionId from outline.sections.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        postId: { type: "string" },
        sectionId: { type: "string" },
        approve: {
          type: "boolean",
          description: "Mark section approved after user confirms text",
        },
      },
      required: ["postId", "sectionId"],
    },
  },
  {
    name: "assemble_blog_post",
    description:
      "Assemble approved sections into body_md + FAQ. Runs SEO gate unless skipSeoGate.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        postId: { type: "string" },
        skipSeoGate: { type: "boolean" },
      },
      required: ["postId"],
    },
  },
  {
    name: "publish_blog_post",
    description:
      "Publish assembled post. scope project (default) or platform (Creator required).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        postId: { type: "string" },
        scope: { type: "string", enum: ["project", "platform"] },
        force: { type: "boolean" },
      },
      required: ["postId"],
    },
  },
  {
    name: "push_design_tokens_to_figma",
    description:
      "Push compiled design tokens to Figma Variables (Enterprise + connected Figma account).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        fileKey: {
          type: "string",
          description:
            "Figma file key (or set projects.figma_variables_file_key)",
        },
      },
    },
  },
  {
    name: "sync_project_assets_to_figma",
    description:
      "Incremental Figma sync — import new assets, update changed, skip unchanged. Returns REST results + MCP instructions for raster/markdown.",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        fileKey: {
          type: "string",
          description:
            "Figma file key (or set projects.figma_variables_file_key)",
        },
      },
    },
  },
  {
    name: "import_repo",
    description:
      "Import brand context from a connected GitHub or GitLab repository into this project (enqueue repo_import)." +
      ASK_USER_PROJECT_SCOPE,
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        owner: { type: "string", description: "Repository owner or org" },
        repo: { type: "string", description: "Repository name" },
        ref: { type: "string", description: "Branch or ref (default main)" },
        provider: { type: "string", enum: ["github", "gitlab"] },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "publish_landing_page",
    description:
      "Publish htmlFrame landing content to Git (new repo, existing repo PR/MR, or org landing path).",
    inputSchema: {
      type: "object",
      properties: {
        ...optionalCredentialProps,
        target: {
          type: "string",
          enum: ["new_repo", "existing_repo", "org_landing"],
        },
        provider: { type: "string", enum: ["github", "gitlab"] },
        elementId: {
          type: "string",
          description: "htmlFrame element id (defaults to first htmlFrame)",
        },
        html: {
          type: "string",
          description: "Optional HTML override (otherwise read from canvas)",
        },
        owner: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        orgLandingPath: { type: "string" },
      },
    },
  },
];
