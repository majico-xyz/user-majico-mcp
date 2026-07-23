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

  it("ping returns auth, project, and hasBrandData from MCP ping route", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/ping")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              projectId: PROJECT_ID,
              projectName: "Dev Canvas Test",
              slug: "dev-canvas-test",
              userId: "user-1",
              hasBrandData: false,
              hasCanvasData: false,
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            projects: [
              {
                id: PROJECT_ID,
                name: "Dev Canvas Test",
                slug: "dev-canvas-test",
                description: "Internal canvas QA project",
                hasBrandData: false,
                hasCanvasData: false,
              },
            ],
            activeProjectId: PROJECT_ID,
            userId: "user-1",
          }),
          { status: 200 }
        )
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("ping", {}, { auth: "oauth" });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      ok: boolean;
      auth: string;
      userId: string;
      projectId: string;
      projectName: string;
      hasBrandData: boolean;
      projectSelectionRequired?: boolean;
    };
    expect(body.ok).toBe(true);
    expect(body.auth).toBe("oauth");
    expect(body.projectId).toBe(PROJECT_ID);
    expect(body.projectName).toBe("Dev Canvas Test");
    expect(body.hasBrandData).toBe(false);
    expect(body.projectSelectionRequired).toBe(true);
    expect(body.hint).toBe(PROJECT_SELECTION_HINT);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/mcp/projects/${PROJECT_ID}/ping`),
      expect.any(Object)
    );
  });

  it("ping flags ambiguous project scope when multiple projects mismatch consumer repo", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const reelId = "660e8400-e29b-41d4-a716-446655440001";
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/ping")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              projectId: PROJECT_ID,
              projectName: "Dev Canvas Test",
              slug: "dev-canvas-test",
              userId: "user-1",
              hasBrandData: true,
              hasCanvasData: true,
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            projects: [
              {
                id: PROJECT_ID,
                name: "Dev Canvas Test",
                slug: "dev-canvas-test",
                description: "Internal canvas QA project",
                hasBrandData: true,
                hasCanvasData: true,
              },
              {
                id: reelId,
                name: "Reeldemo Ableton",
                slug: "reeldemo-ableton",
                description: "Live performance visuals for Ableton",
                hasBrandData: false,
                hasCanvasData: false,
              },
            ],
            activeProjectId: PROJECT_ID,
            userId: "user-1",
          }),
          { status: 200 }
        )
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("ping", {
      consumerRepo: "/Users/julian/coding-projects/reeldemo-ableton",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      projectSelectionRequired: boolean;
      hint: string;
      suggestedProjectId: string;
      suggestedProjectName: string;
      relevantProjects: Array<{ id: string; name: string }>;
    };
    expect(body.projectSelectionRequired).toBe(true);
    expect(body.hint).toBe(PROJECT_SELECTION_HINT);
    expect(body.suggestedProjectId).toBe(reelId);
    expect(body.suggestedProjectName).toBe("Reeldemo Ableton");
    expect(body.relevantProjects[0]?.id).toBe(reelId);
    expect(body.relevantProjects).toHaveLength(2);
  });

  it("list_projects calls user-scoped projects API", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          projects: [
            {
              id: PROJECT_ID,
              name: "Dev Canvas Test",
              slug: "dev-canvas-test",
              description: "Internal canvas QA project",
              hasBrandData: false,
              hasCanvasData: false,
            },
          ],
          activeProjectId: PROJECT_ID,
          userId: "user-1",
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("list_projects", {});
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      projects: Array<{ id: string }>;
      relevantProjects: Array<{
        id: string;
        name: string;
        description: string;
      }>;
      totalProjectCount: number;
    };
    expect(body.projects[0]?.id).toBe(PROJECT_ID);
    expect(body.relevantProjects[0]?.id).toBe(PROJECT_ID);
    expect(body.totalProjectCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/mcp/projects"),
      expect.any(Object)
    );
  });

  it("bootstrap_project is rejected without admin tools flag", async () => {
    const result = await handleMajicoToolCall("bootstrap_project", {
      name: "test",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("admin-only");
  });

  it("create_project calls user-scoped MCP projects POST", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "new-project-id",
          name: "Reeldemo Ableton",
          slug: "reeldemo-ableton",
          projectApiKey: "majico_new_key",
          hasBrandData: false,
          oauthMcpConfig: {
            type: "http",
            url: "http://127.0.0.1:3001/mcp",
          },
          httpMcpConfig: {
            type: "http",
            url: "http://127.0.0.1:3001/mcp",
            headers: {
              Authorization: "Bearer majico_new_key",
              "X-Majico-Project-Id": "new-project-id",
            },
          },
          oauthReconnectInstructions: [
            "Reconnect OAuth and pick project new-project-id",
          ],
          nextSteps: ["Call ping with projectId"],
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("create_project", {
      name: "Reeldemo Ableton",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      id: string;
      name: string;
    };
    expect(body.id).toBe("new-project-id");
    expect(body.name).toBe("Reeldemo Ableton");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/mcp/projects"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("delete_project calls user-scoped MCP projects DELETE with confirm", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, projectId: PROJECT_ID }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("delete_project", {
      projectId: PROJECT_ID,
      confirm: true,
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      ok: boolean;
      projectId: string;
    };
    expect(body.ok).toBe(true);
    expect(body.projectId).toBe(PROJECT_ID);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/mcp/projects"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("get_project_api_key calls /api-key", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          projectId: PROJECT_ID,
          projectApiKey: "majico_agent_key",
          rotated: false,
          httpMcpConfig: {
            type: "http",
            url: "http://127.0.0.1:3001/mcp",
            headers: {
              Authorization: "Bearer majico_agent_key",
              "X-Majico-Project-Id": PROJECT_ID,
            },
          },
          envSnippet: {
            MAJICO_API_URL: "http://127.0.0.1:3001",
            MAJICO_PROJECT_ID: PROJECT_ID,
            MAJICO_API_KEY: "majico_agent_key",
          },
          instructions: ["Store in gitignored env"],
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("get_project_api_key", {
      projectId: PROJECT_ID,
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      projectApiKey: string;
    };
    expect(body.projectApiKey).toBe("majico_agent_key");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/mcp/projects/${PROJECT_ID}/api-key`),
      expect.any(Object)
    );
  });

  it("listMcpTools includes get_project_api_key", () => {
    const names = listMcpTools().map((tool) => tool.name);
    expect(names).toContain("get_project_api_key");
    expect(names).toContain("mint_project_api_key");
  });

  it("listMcpTools hides bootstrap tools by default", () => {
    const names = listMcpTools().map((tool) => tool.name);
    expect(names).not.toContain("bootstrap_project");
    expect(
      listMcpTools({ includeAdminTools: true }).map((t) => t.name)
    ).toContain("bootstrap_project");
  });

  it("select_palette rejects without userConfirmed or userDelegatedPick", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const result = await handleMajicoToolCall("select_palette", {
      optionId: "suggested:0",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("userConfirmed");
    expect(result.content[0]?.text).toContain("userDelegatedPick");
  });

  it("select_palette proceeds when userConfirmed is true", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          paletteTokens: { light: {}, dark: {} },
          selectedOptionId: "suggested:0",
          cursorHandoff: { event: "palette_selected" },
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("select_palette", {
      optionId: "suggested:0",
      userConfirmed: true,
    });
    expect(result.isError).toBeFalsy();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("select_palette proceeds when userDelegatedPick is true", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          paletteTokens: { light: {}, dark: {} },
          selectedOptionId: "suggested:1",
          cursorHandoff: { event: "palette_selected" },
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("select_palette", {
      optionId: "suggested:1",
      userDelegatedPick: true,
    });
    expect(result.isError).toBeFalsy();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("select_logo rejects without userConfirmed or userDelegatedPick", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";

    const result = await handleMajicoToolCall("select_logo", {
      candidateId: "cand-1",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("userConfirmed");
    expect(result.content[0]?.text).toContain("userDelegatedPick");
  });

  it("generate_brand_md returns stable markdown from explicit inputs", async () => {
    const result = await handleMajicoToolCall("generate_brand_md", {
      productName: "Majico",
      positioningConcept: "AI branding copilot for developers",
      audience: "Founders shipping product fast",
      tone: "Confident, clear, practical",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      productName: string;
      markdown: string;
      sections: string[];
    };
    expect(body.productName).toBe("Majico");
    expect(body.sections).toEqual([
      "product_name",
      "positioning_concept",
      "audience",
      "tone",
    ]);
    expect(body.markdown).toContain("# Majico");
    expect(body.markdown).toContain("AI branding copilot for developers");
    expect(body.markdown).toContain("Founders shipping product fast");
    expect(body.markdown).toContain("Confident, clear, practical");
  });
});
