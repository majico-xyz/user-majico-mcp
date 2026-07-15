import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handleMajicoToolCall,
  listMcpTools,
  MAJICO_USER_TOOLS,
} from "./tools.js";
import { PROJECT_SELECTION_HINT } from "./project-selection.js";

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const ORIGINAL_FETCH = globalThis.fetch;

describe("handleMajicoToolCall", () => {
  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    delete process.env.MAJICO_PROJECT_ID;
    delete process.env.MAJICO_API_KEY;
    delete process.env.MAJICO_API_URL;
  });

  it("uses env credentials when args omit projectId and apiKey", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          primaryArchetype: "Creator",
          secondaryArchetype: null,
          archetypeBalance: null,
          nicheIntent: "devtools",
          brandTones: [],
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("get_brand_profile", {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0]?.text).toContain("Creator");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/mcp/projects/${PROJECT_ID}/brand`),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer env-key" }),
      })
    );
  });

  it("returns authRequired when OAuth credentials missing", async () => {
    delete process.env.MAJICO_PROJECT_ID;
    delete process.env.MAJICO_API_KEY;
    delete process.env.MAJICO_API_URL;
    const result = await handleMajicoToolCall(
      "get_guidelines",
      {},
      {
        auth: "oauth",
      }
    );
    expect(result.isError).toBe(true);
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      authRequired?: boolean;
      action?: string;
    };
    expect(body.authRequired).toBe(true);
    expect(body.action).toBe("connect_oauth");
  });

  it("mcp_auth returns connect prompt for agents", async () => {
    const result = await handleMajicoToolCall("mcp_auth", {});
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      authRequired?: boolean;
      message?: string;
    };
    expect(body.authRequired).toBe(true);
    expect(body.message).toContain("Settings → MCP → majico");
  });

  it("ping returns authRequired when OAuth session lacks Pro/Creator plan", async () => {
    const result = await handleMajicoToolCall(
      "ping",
      {},
      {
        auth: "oauth",
        userId: "user-1",
        projectId: PROJECT_ID,
        planRequired: true,
      }
    );
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      ok?: boolean;
      authRequired?: boolean;
      action?: string;
    };
    expect(body.ok).toBe(false);
    expect(body.authRequired).toBe(true);
    expect(body.action).toBe("upgrade_plan");
  });

  it("list_logo_candidates returns SVG preview text blocks", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://majico.d3bu7.com";

    const svg =
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48"/></svg>';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          selectedLogoTemplateId: null,
          logoSvg: null,
          logoFavorites: [],
          shortlistCount: 0,
          candidates: [{ id: "cand-1", kind: "generated", previewSvg: svg }],
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall(
      "list_logo_candidates",
      {},
      {
        publicBaseUrl: "https://majico.d3bu7.com",
      }
    );
    expect(result.isError).toBeFalsy();
    expect(
      result.content.some(
        (b) => b.type === "image" && b.mimeType === "image/png"
      )
    ).toBe(true);
    expect(result.content[0]?.text).toContain("cand-1");
  });

  it("per-call credentials override env", async () => {
    process.env.MAJICO_PROJECT_ID = "00000000-0000-4000-8000-000000000001";
    process.env.MAJICO_API_KEY = "env-key";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tokens: { light: {}, dark: {} } }), {
        status: 200,
      })
    );
    globalThis.fetch = fetchMock as typeof fetch;

    await handleMajicoToolCall("get_design_tokens", {
      projectId: PROJECT_ID,
      apiKey: "call-key",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(PROJECT_ID),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer call-key" }),
      })
    );
  });

  it("publishes local verification and contract-friendly alias tools", () => {
    const toolNames = new Set(MAJICO_USER_TOOLS.map((tool) => tool.name));
    expect(toolNames.has("mcp_auth")).toBe(true);
    expect(toolNames.has("ping")).toBe(true);
    expect(toolNames.has("health")).toBe(true);
    expect(toolNames.has("list_projects")).toBe(true);
    expect(toolNames.has("create_project")).toBe(true);
    expect(toolNames.has("brand")).toBe(true);
    expect(toolNames.has("design_md")).toBe(true);
    expect(toolNames.has("tokens")).toBe(true);
    expect(toolNames.has("guidelines")).toBe(true);
    expect(toolNames.has("logos")).toBe(true);
    expect(toolNames.has("studio")).toBe(true);
    expect(toolNames.has("cursor_handoff")).toBe(true);
    expect(toolNames.has("export_manifest")).toBe(true);
    expect(toolNames.has("submit_brief")).toBe(true);
    expect(toolNames.has("download_export_zip")).toBe(true);
    expect(toolNames.has("generate_brand_md")).toBe(true);
    expect(toolNames.has("get_ui_ux_skills")).toBe(true);
  });

  it("submit_brief and download_export_zip omit Studio-rail and local SearXNG copy", () => {
    const submitBrief = MAJICO_USER_TOOLS.find(
      (entry) => entry.name === "submit_brief"
    );
    const downloadZip = MAJICO_USER_TOOLS.find(
      (entry) => entry.name === "download_export_zip"
    );
    expect(submitBrief?.description).not.toMatch(/Studio brief rail/i);
    expect(submitBrief?.description).not.toMatch(/SearXNG|Ollama/i);
    expect(downloadZip?.description).not.toMatch(/Studio export/i);
  });

  it("get_ui_ux_skills returns curated workflow without credentials", async () => {
    const result = await handleMajicoToolCall("get_ui_ux_skills", {});
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      version: number;
      skills: Array<{ id: string }>;
      markdown: string;
    };
    expect(body.version).toBe(1);
    expect(
      body.skills.some((skill) => skill.id === "majico-branding-sync")
    ).toBe(true);
    expect(body.markdown).toContain("## 11. Cursor UI/UX skills");
  });
});
