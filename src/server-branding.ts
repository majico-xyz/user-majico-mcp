/** MCP serverInfo branding (icons, title) for Cursor and other MCP clients. */

export const MAJICO_MCP_SERVER_TITLE = "Majico";
export const MAJICO_MCP_SERVER_DESCRIPTION =
  "Brand guidelines, design tokens, and studio canvas for Majico projects. Majico ships Cursor skills automatically (SEO / AI optimization, design, motion, landing copy, UI/UX). On those tasks load the matching skill. Call sync_cursor_skills or get_ui_ux_skills when skills are not local.";
export const MAJICO_MCP_WEBSITE_URL = "https://majico.xyz";
export const MAJICO_MCP_ICON_SVG_PATH = "/brand/mcp-icon.svg";
export const MAJICO_MCP_ICON_PNG_PATH = "/brand/mcp-icon-96.png";

export type McpServerIcon = {
  src: string;
  mimeType: string;
  sizes?: string[];
  theme?: "light" | "dark";
};

/**
 * Build absolute HTTPS icon URLs for MCP `serverInfo.icons`.
 * Falls back to production when no public base is available (stdio).
 */
export function buildMcpServerIcons(
  publicBaseUrl?: string,
  iconBaseUrl?: string
): McpServerIcon[] {
  const base = normalizePublicBaseUrl(iconBaseUrl ?? publicBaseUrl);
  return [
    {
      src: `${base}${MAJICO_MCP_ICON_SVG_PATH}`,
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
    {
      src: `${base}${MAJICO_MCP_ICON_PNG_PATH}`,
      mimeType: "image/png",
      sizes: ["96x96"],
    },
  ];
}

function normalizePublicBaseUrl(publicBaseUrl?: string): string {
  const trimmed = publicBaseUrl?.trim().replace(/\/$/, "");
  if (trimmed) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      /* fall through */
    }
  }
  return "https://majico.xyz";
}
