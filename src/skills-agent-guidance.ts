/**
 * Canonical agent-facing guidance for Majico-shipped Cursor skills.
 * Keep in sync with majico.xyz packages/cursor-skills/src/agent-skills-guidance.ts.
 */

/** Full guidance for workflowHint, handoff notes, and ping.skillsGuidance. */
export const MAJICO_SKILLS_MUST_USE_GUIDANCE =
  "Majico ships Cursor skills automatically (SEO / AI optimization, design, motion, landing copy, and other UI/UX guides). On brand, UI, landing, SEO, or motion work: load and follow the matching Majico skill. Call get_ui_ux_skills or sync_cursor_skills proactively when skills are not already local. Do not wait for the user to ask again to fetch skills.";

/** Short suffix for MCP branding / export tool descriptions. */
export const MAJICO_SKILLS_TOOL_DESCRIPTION_SUFFIX =
  " REQUIRED: When generating UI, landing pages, SEO, motion, or landing copy, apply the matching Majico-shipped Cursor skills. Majico auto-ships them via sync_cursor_skills / get_ui_ux_skills / plugin skill sync. Call those tools yourself if skills are not local.";

/** Sync-to-repo note for markdown handoffs. */
export const MAJICO_SKILLS_SYNC_NOTE =
  "**Required:** Majico ships these skills automatically. On UI, landing, SEO, motion, or copy work, load the matching skill. Call MCP `sync_cursor_skills` to write `.cursor/skills/` when skills are not local. Plugin skills load when installed in Cursor. Users edit project skills via `update_cursor_skill`.";
