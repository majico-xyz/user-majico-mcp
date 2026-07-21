import { describe, expect, it } from "vitest";
import {
  MAJICO_SKILLS_MUST_USE_GUIDANCE,
  MAJICO_SKILLS_SYNC_NOTE,
  MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX,
} from "./skills-agent-guidance.js";
import { listMcpTools } from "./tools.js";
import { renderUiUxSkillsHandoffMarkdown } from "./ui-ux-skills.js";
import { MAJICO_MCP_SERVER_DESCRIPTION } from "./server-branding.js";

describe("skills agent guidance", () => {
  it("exports must-use and auto-ship strings without anti-slop violations", () => {
    for (const text of [
      MAJICO_SKILLS_MUST_USE_GUIDANCE,
      MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX,
      MAJICO_SKILLS_SYNC_NOTE,
    ]) {
      expect(text).toMatch(/sync_cursor_skills/);
      expect(text).toMatch(/SEO|landing|motion|design/i);
      expect(text).toMatch(/landing-page-oneshot/);
      expect(text).not.toMatch(/—/);
      expect(text).not.toMatch(/; and\b/);
    }
  });

  it("embeds guidance in key tool descriptions and server description", () => {
    const tools = listMcpTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool.description]));
    for (const name of [
      "get_ui_ux_skills",
      "sync_cursor_skills",
      "get_brand_md",
      "get_guidelines",
      "ping",
      "publish_landing_page",
    ]) {
      expect(byName.get(name)).toContain("Majico-shipped Cursor skills");
      expect(byName.get(name)).toContain("sync_cursor_skills");
      expect(byName.get(name)).toContain("landing-page-oneshot");
    }
    expect(MAJICO_MCP_SERVER_DESCRIPTION).toContain(
      "ships Cursor skills automatically"
    );
    expect(MAJICO_MCP_SERVER_DESCRIPTION).toContain("landing-page-oneshot");
  });

  it("includes auto-ship guidance in get_ui_ux_skills markdown", () => {
    const md = renderUiUxSkillsHandoffMarkdown();
    expect(md).toContain("ships Cursor skills automatically");
    expect(md).toContain("Do not wait for the user to ask again");
    expect(md).toContain("sync_cursor_skills");
    expect(md).toContain("landing-page-oneshot");
    expect(md).toContain("hero budget");
  });
});
