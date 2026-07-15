import { afterEach, describe, expect, it } from "vitest";
import { resolveCredentials } from "./credentials.js";

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_PROJECT_ID = "00000000-0000-4000-8000-000000000002";

describe("resolveCredentials", () => {
  afterEach(() => {
    delete process.env.MAJICO_PROJECT_ID;
    delete process.env.MAJICO_API_KEY;
    delete process.env.MAJICO_API_URL;
  });

  it("prefers per-call values over env", async () => {
    process.env.MAJICO_PROJECT_ID = "00000000-0000-4000-8000-000000000001";
    process.env.MAJICO_API_KEY = "env-key";

    const resolved = await resolveCredentials({
      projectId: PROJECT_ID,
      apiKey: "call-key",
    });

    expect(resolved).toEqual({
      projectId: PROJECT_ID,
      apiKey: "call-key",
      baseUrl: undefined,
    });
  });

  it("falls back to env when args omitted", async () => {
    process.env.MAJICO_PROJECT_ID = PROJECT_ID;
    process.env.MAJICO_API_KEY = "env-key";
    process.env.MAJICO_API_URL = "https://api.majico.xyz";

    const resolved = await resolveCredentials({});
    expect(resolved).toEqual({
      projectId: PROJECT_ID,
      apiKey: "env-key",
      baseUrl: "https://api.majico.xyz",
    });
  });

  it("delegates OAuth project scope server-side when projectId differs", async () => {
    const resolved = await resolveCredentials(
      { projectId: OTHER_PROJECT_ID },
      {
        projectId: PROJECT_ID,
        apiKey: "oauth-default-key",
        resolveOAuthProject: async (projectId) => ({
          projectId,
          apiKey: "delegated-key",
        }),
      }
    );

    expect(resolved).toEqual({
      projectId: OTHER_PROJECT_ID,
      apiKey: "delegated-key",
      baseUrl: undefined,
    });
  });
});
