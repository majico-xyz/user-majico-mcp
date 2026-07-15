import { describe, expect, it } from "vitest";
import {
  MAJICO_MCP_CONNECT_PROMPT,
  buildMcpAuthRequiredPayload,
} from "./auth-prompt.js";

describe("buildMcpAuthRequiredPayload", () => {
  it("returns connect_oauth agent payload", () => {
    const payload = buildMcpAuthRequiredPayload("connect_oauth");
    expect(payload).toEqual({
      authRequired: true,
      action: "connect_oauth",
      message: MAJICO_MCP_CONNECT_PROMPT,
      agentInstructions: expect.stringContaining("verbatim"),
    });
  });

  it("returns upgrade_plan agent payload", () => {
    const payload = buildMcpAuthRequiredPayload("upgrade_plan");
    expect(payload.authRequired).toBe(true);
    expect(payload.action).toBe("upgrade_plan");
    expect(payload.message).toContain("tokens");
  });
});
