import { afterEach, describe, expect, it, vi } from "vitest";
import { handleMajicoToolCall } from "./tools.js";

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const ORIGINAL_FETCH = globalThis.fetch;

describe("submit_brief MCP tool", () => {
  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    delete process.env.MAJICO_PROJECT_ID;
    delete process.env.MAJICO_API_KEY;
    delete process.env.MAJICO_API_URL;
  });

  it("returns validation error when productName or oneLiner missing", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const result = await handleMajicoToolCall("submit_brief", {
      productName: "  ",
      oneLiner: "Valid one-liner",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("productName and oneLiner");
  });

  it("POSTs brief payload to MCP brief route", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "http://127.0.0.1:3001";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          projectId: PROJECT_ID,
          briefId: "brief-1",
          jobId: "job-1",
          status: "pending",
          nextSteps: ["poll job"],
        }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await handleMajicoToolCall("submit_brief", {
      productName: "Korvai",
      oneLiner: "AI rhythm for producers",
      audience: "beat makers",
    });
    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]?.text ?? "{}") as {
      jobId?: string;
      briefId?: string;
    };
    expect(body.jobId).toBe("job-1");
    expect(body.briefId).toBe("brief-1");
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:3001/api/mcp/projects/${PROJECT_ID}/brief`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer env-key",
          "Content-Type": "application/json",
        }),
      })
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as {
      productName: string;
      oneLiner: string;
      audience?: string;
    };
    expect(payload.productName).toBe("Korvai");
    expect(payload.oneLiner).toBe("AI rhythm for producers");
    expect(payload.audience).toBe("beat makers");
  });
});
