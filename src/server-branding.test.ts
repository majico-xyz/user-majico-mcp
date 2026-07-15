import { describe, expect, it } from "vitest";
import {
  buildMcpServerIcons,
  MAJICO_MCP_ICON_PNG_PATH,
  MAJICO_MCP_ICON_SVG_PATH,
} from "./server-branding.js";

describe("buildMcpServerIcons", () => {
  it("uses the request origin for icon URLs", () => {
    const icons = buildMcpServerIcons("http://127.0.0.1:3000");
    expect(icons[0]?.src).toBe(
      `http://127.0.0.1:3000${MAJICO_MCP_ICON_SVG_PATH}`
    );
    expect(icons[1]?.src).toBe(
      `http://127.0.0.1:3000${MAJICO_MCP_ICON_PNG_PATH}`
    );
  });

  it("prefers iconBaseUrl over publicBaseUrl for static assets", () => {
    const icons = buildMcpServerIcons(
      "https://api.majico.xyz",
      "https://majico.xyz"
    );
    expect(icons[0]?.src).toBe(`https://majico.xyz${MAJICO_MCP_ICON_SVG_PATH}`);
  });

  it("falls back to majico.xyz when public base is missing", () => {
    const icons = buildMcpServerIcons();
    expect(icons[0]?.src).toBe(`https://majico.xyz${MAJICO_MCP_ICON_SVG_PATH}`);
  });
});
