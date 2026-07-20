/**
 * Majico-curated Cursor UI/UX skills for agent handoff.
 * Read together with BRAND.md + DESIGN.md when applying brand to a consumer repo.
 *
 * Canonical source: `lib/agent-handoff/ui-ux-skills.ts` (keep in sync when editing).
 */

import { buildRecommendedExternalSkillsPayload } from "./recommended-external-skills.js";
import {
  MAJICO_SKILLS_MUST_USE_GUIDANCE,
  MAJICO_SKILLS_SYNC_NOTE,
} from "./skills-agent-guidance.js";

export type UiUxSkillPhase =
  | "prepare"
  | "discover"
  | "implement"
  | "sync"
  | "verify";

export type UiUxSkillSource = "majico" | "cursor-plugin" | "optional";

export interface UiUxSkillEntry {
  id: string;
  name: string;
  skillRef: string;
  phase: UiUxSkillPhase;
  source: UiUxSkillSource;
  whenToUse: string;
  requiresMcp?: "majico" | "figma";
  priority: number;
}

export const UI_UX_SKILL_PHASE_LABELS: Record<UiUxSkillPhase, string> = {
  prepare: "Prepare — read handoff docs and connect MCP",
  discover: "Discover — layout and UX decisions before building",
  implement: "Implement — components, tokens, and polish in code",
  sync: "Sync — Figma / design-system parity",
  verify: "Verify — regression tests and completion gate",
};

export const MAJICO_UI_UX_SKILLS: readonly UiUxSkillEntry[] = [
  {
    id: "majico-branding-sync",
    name: "Majico branding sync",
    skillRef: "majico-branding-sync",
    phase: "prepare",
    source: "majico",
    whenToUse:
      "Always when applying Majico brand via MCP — OAuth gate, project scope, get_brand_md / get_design_md / get_design_tokens workflow.",
    requiresMcp: "majico",
    priority: 1,
  },
  {
    id: "brainstorming",
    name: "Brainstorming",
    skillRef: "brainstorming",
    phase: "discover",
    source: "cursor-plugin",
    whenToUse:
      "Before net-new screens, landing sections, or navigation — explore layout and UX intent aligned with BRAND.md voice and DESIGN.md layout principles.",
    priority: 2,
  },
  {
    id: "figma-use",
    name: "Figma use",
    skillRef: "figma-use",
    phase: "sync",
    source: "cursor-plugin",
    whenToUse:
      "Mandatory prerequisite before any Figma MCP write/read — load before figma-generate-design or push tokens.",
    requiresMcp: "figma",
    priority: 3,
  },
  {
    id: "figma-generate-design",
    name: "Figma generate design",
    skillRef: "figma-generate-design",
    phase: "sync",
    source: "cursor-plugin",
    whenToUse:
      "Push implemented pages to Figma or capture reference layouts when Cursor Figma MCP is connected.",
    requiresMcp: "figma",
    priority: 4,
  },
  {
    id: "figma-generate-library",
    name: "Figma generate library",
    skillRef: "figma-generate-library",
    phase: "sync",
    source: "cursor-plugin",
    whenToUse:
      "Build or extend a component library / variables in Figma from DESIGN.md tokens.",
    requiresMcp: "figma",
    priority: 5,
  },
  {
    id: "figma-implement-motion",
    name: "Figma implement motion",
    skillRef: "figma-implement-motion",
    phase: "implement",
    source: "cursor-plugin",
    whenToUse:
      "Translate motion specs from Figma into production CSS/animation after base UI matches tokens.",
    requiresMcp: "figma",
    priority: 6,
  },
  {
    id: "verification-before-completion",
    name: "Verification before completion",
    skillRef: "verification-before-completion",
    phase: "verify",
    source: "cursor-plugin",
    whenToUse:
      "Before claiming UI work is done — run tests, validate light/dark themes, and confirm token usage.",
    priority: 7,
  },
] as const;

export const UI_UX_HANDOFF_WORKFLOW_STEPS: readonly string[] = [
  MAJICO_SKILLS_MUST_USE_GUIDANCE,
  "Read **BRAND.md** + **DESIGN.md** together: identity/voice first, then tokens, typography, components, layout.",
  "If Majico MCP is connected: call `sync_cursor_skills` / `get_ui_ux_skills` if skills are not local, load **majico-branding-sync**, then call `get_brand_md`, `get_design_md`, `get_design_tokens`, and `get_logo_svg` (when logo exists).",
  "For greenfield UI: load **brainstorming**. Lock hero order (headline → subcopy → CTA) and section rhythm before coding.",
  "Map DESIGN.md tokens to repo CSS variables / theme config. Never hardcode brand hex in components.",
  "Implement surfaces using DESIGN.md component + layout rules. Write copy from BRAND.md voice and do's/don'ts. For motion or landing work, load the matching Majico skill (for example `ui-motion-expressive`, `ui-layout-discover`).",
  "When Cursor Figma MCP is connected: load **figma-use**, then **figma-generate-design** or **figma-generate-library** for parity.",
  "For UI/CSS fixes: add a regression test that would have failed before the change.",
  "Before done: load **verification-before-completion**; if this session started from Studio handoff, call `ack_cursor_handoff`.",
] as const;

function sourceLabel(source: UiUxSkillSource): string {
  switch (source) {
    case "majico":
      return "Majico (repo / MCP)";
    case "cursor-plugin":
      return "Cursor plugin skill";
    case "optional":
      return "Optional";
    default:
      return source;
  }
}

function mcpRequirement(entry: UiUxSkillEntry): string {
  if (!entry.requiresMcp) return "";
  return entry.requiresMcp === "majico"
    ? " — requires Majico MCP"
    : " — requires Cursor Figma MCP";
}

export function renderUiUxSkillsHandoffMarkdown(options?: {
  headingLevel?: "##" | "###";
}): string {
  const heading = options?.headingLevel ?? "##";
  const lines: string[] = [
    `${heading} 11. Cursor UI/UX skills (agent workflow)`,
    "",
    "Majico curates these Cursor skills so agents ship **on-brand UI**. Use with the handoff pair **[BRAND.md](./BRAND.md) + [design.md](./design.md)** (or `get_brand_md` + `get_design_md` via MCP).",
    "",
    MAJICO_SKILLS_MUST_USE_GUIDANCE,
    "",
    "### Reading order",
    "",
    "1. **BRAND.md**: identity, voice, positioning, visual summary, do's/don'ts",
    "2. **design.md**: tokens, typography, components, layout (source of truth for CSS)",
    "3. **This section**: which skills to load and in what order",
    "",
    "### Curated skills",
    "",
  ];

  const sorted = [...MAJICO_UI_UX_SKILLS].sort(
    (a, b) => a.priority - b.priority
  );

  for (const entry of sorted) {
    lines.push(
      `- **${entry.name}** (\`${entry.skillRef}\`, ${UI_UX_SKILL_PHASE_LABELS[entry.phase]}) — ${entry.whenToUse}${mcpRequirement(entry)}`,
      `  - Source: ${sourceLabel(entry.source)}`,
      ""
    );
  }

  lines.push(
    "### Agent workflow",
    "",
    ...UI_UX_HANDOFF_WORKFLOW_STEPS.map(
      (step, index) => `${index + 1}. ${step}`
    ),
    "",
    MAJICO_SKILLS_SYNC_NOTE,
    "",
    "### Optional killer UI/UX skills (external)",
    "",
    "Research-backed installs via `npx ui-skills add <skill>` — optional, stack-dependent. See MCP `recommendedExternal` or `docs/internal/cursor-ui-ux-skills-research.md`.",
    "",
    "**UI:** ui-skills-root, baseline-ui, make-interfaces-feel-better, fixing-accessibility",
    "",
    "**UX:** shape, clarify, harden, uxauditor",
    ""
  );

  return lines.join("\n").trimEnd();
}

export function buildUiUxSkillsHandoffPayload(): {
  version: 1;
  skills: UiUxSkillEntry[];
  workflowSteps: string[];
  readingOrder: string[];
  recommendedExternal: ReturnType<typeof buildRecommendedExternalSkillsPayload>;
} {
  return {
    version: 1,
    skills: [...MAJICO_UI_UX_SKILLS],
    workflowSteps: [...UI_UX_HANDOFF_WORKFLOW_STEPS],
    readingOrder: [
      "BRAND.md — identity, voice, positioning",
      "design.md — tokens, typography, components, layout",
      "UI/UX skills — load order and MCP/Figma gates",
      "Optional external skills — npx ui-skills (see recommendedExternal)",
    ],
    recommendedExternal: buildRecommendedExternalSkillsPayload(),
  };
}

export function figmaHandoffSkillRefs(): string[] {
  return MAJICO_UI_UX_SKILLS.filter(
    (entry) =>
      entry.requiresMcp === "figma" ||
      entry.id === "majico-branding-sync" ||
      entry.id === "verification-before-completion"
  )
    .sort((a, b) => a.priority - b.priority)
    .map((entry) => `/${entry.skillRef}`);
}
