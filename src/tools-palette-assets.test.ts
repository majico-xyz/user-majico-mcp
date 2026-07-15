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

  it("generate_asset enqueues investor-pack via MCP assets generate path", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          skillId: "investor-pack",
          jobId: "job-investor-1",
          async: true,
          scopeChain: ["global"],
          backend: "harness-native",
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("generate_asset", {
      skillId: "investor-pack",
      params: {
        team: {
          members: [{ name: "Alex", role: "CEO" }],
        },
        traction: {
          metrics: [{ label: "Waitlist", value: "500" }],
        },
        includeSlides: ["financials"],
      },
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      ok: boolean;
      skillId: string;
      jobId: string;
    };
    expect(body.ok).toBe(true);
    expect(body.skillId).toBe("investor-pack");
    expect(body.jobId).toBe("job-investor-1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `/api/mcp/projects/${PROJECT_ID}/assets/generate`
      ),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("investor-pack"),
      })
    );
    const requestBody = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string
    ) as {
      skillId: string;
      params: { includeSlides: string[] };
    };
    expect(requestBody.skillId).toBe("investor-pack");
    expect(requestBody.params.includeSlides).toEqual(["financials"]);
  });

  it("generate_asset surfaces investor-pack preflight blocked errors", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          code: "investor_pack_preflight_blocked",
          blocked: "traction",
          message:
            "Add at least one traction metric or alternative proof item before generating an investor pack.",
          skillId: "investor-pack",
          error:
            "Add at least one traction metric or alternative proof item before generating an investor pack.",
        }),
        { status: 422 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("generate_asset", {
      skillId: "investor-pack",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("traction metric");
  });

  it("generate_asset tool schema documents investor-pack params", () => {
    const tool = MAJICO_USER_TOOLS.find(
      (entry) => entry.name === "generate_asset"
    );
    expect(tool).toBeDefined();
    expect(tool?.description).toContain("investor-pack");
    expect(tool?.description).toContain("investor-one-pager");
    expect(tool?.description).toContain("investor-data-room");
    const paramsSchema = tool?.inputSchema?.properties?.params as {
      properties?: Record<string, unknown>;
    };
    expect(paramsSchema?.properties?.team).toBeDefined();
    expect(paramsSchema?.properties?.traction).toBeDefined();
    expect(paramsSchema?.properties?.includeSlides).toBeDefined();
  });

  it("generate_asset enqueues investor-data-room via MCP assets generate path", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          skillId: "investor-data-room",
          jobId: "job-data-room-1",
          async: true,
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("generate_asset", {
      skillId: "investor-data-room",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      skillId: string;
      jobId: string;
    };
    expect(body.skillId).toBe("investor-data-room");
    expect(body.jobId).toBe("job-data-room-1");
  });

  it("generate_asset enqueues investor-one-pager via MCP assets generate path", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          skillId: "investor-one-pager",
          jobId: "job-one-pager-1",
          async: true,
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("generate_asset", {
      skillId: "investor-one-pager",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      skillId: string;
      jobId: string;
    };
    expect(body.skillId).toBe("investor-one-pager");
    expect(body.jobId).toBe("job-one-pager-1");
  });
});
