import { describe, expect, it } from "vitest";
import {
  MCP_REQUIRED_SDK_RESOURCES,
  mcpSdkSurfaceError,
} from "./sdk-surface.js";

describe("mcpSdkSurfaceError", () => {
  it("passes a full client surface", () => {
    const client = Object.fromEntries(
      MCP_REQUIRED_SDK_RESOURCES.map((key) => [key, { ok: true }])
    );
    expect(mcpSdkSurfaceError(client)).toBeNull();
  });

  it("fails when projects is missing (sdk 1.0.1 regression)", () => {
    const client = Object.fromEntries(
      MCP_REQUIRED_SDK_RESOURCES.filter((k) => k !== "projects").map((key) => [
        key,
        { ok: true },
      ])
    );
    const err = mcpSdkSurfaceError(client);
    expect(err).toContain("Incompatible @majico/sdk");
    expect(err).toContain("1.1.0");
  });

  it("fails when palette is null", () => {
    const client = Object.fromEntries(
      MCP_REQUIRED_SDK_RESOURCES.map((key) => [
        key,
        key === "palette" ? null : { ok: true },
      ])
    );
    expect(mcpSdkSurfaceError(client)).toContain("Incompatible @majico/sdk");
  });

  it("fails when client is empty (1.0.1-shaped)", () => {
    expect(mcpSdkSurfaceError({})).toContain("1.0.1");
  });
});
